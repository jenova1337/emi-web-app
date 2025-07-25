import React, { useEffect, useState } from "react";

export default function ExistingPlans({ goBack }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let saved = JSON.parse(localStorage.getItem("emiPlans")) || [];

    saved = saved.map((plan) => {
      if (!plan.payments && Array.isArray(plan.paid)) {
        plan.payments = plan.paid.map((date) => ({
          date,
          amount: plan.monthlyEmi,
          type: "Fixed",
        }));
        delete plan.paid;
      } else if (!plan.payments) {
        plan.payments = [];
      }
      return plan;
    });

    setPlans(saved);
    localStorage.setItem("emiPlans", JSON.stringify(saved));
  }, []);

  const savePlans = (updated) => {
    localStorage.setItem("emiPlans", JSON.stringify(updated));
    setPlans(updated);
  };

  const getTotalPaid = (payments) =>
    payments.reduce((sum, p) => sum + p.amount, 0);

  const getBalance = (plan) =>
    Math.max(0, plan.totalAmount - getTotalPaid(plan.payments));

  const addPayment = (planIndex, amount, type, customDate) => {
    const updatedPlans = [...plans];
    const plan = updatedPlans[planIndex];
    const totalPaid = getTotalPaid(plan.payments);
    const remaining = plan.totalAmount - totalPaid;
    const paymentAmount = parseFloat(amount);
    const date = customDate || new Date().toLocaleDateString("en-GB");

    if (paymentAmount <= 0 || isNaN(paymentAmount)) {
      alert("Invalid payment amount.");
      return;
    }

    if (remaining <= 0) {
      alert("🎉 This EMI plan is fully paid. No further payments allowed.");
      return;
    }

    if (paymentAmount > remaining) {
      alert(`❌ Cannot pay ₹${paymentAmount}. Only ₹${remaining} remaining.`);
      return;
    }

    plan.payments.push({ date, amount: paymentAmount, type });
    savePlans(updatedPlans);
    alert(`✅ ${type} payment of ₹${paymentAmount} added successfully.`);
  };

  const handleFixedPayment = (index) => {
    const plan = plans[index];
    const totalPaid = getTotalPaid(plan.payments);
    const remaining = plan.totalAmount - totalPaid;

    if (remaining <= 0) {
      alert("🎉 EMI fully paid. No more Fixed payments allowed.");
      return;
    }

    const inputDate = prompt("Enter date (dd/mm/yyyy) or leave blank for today:");
    const dateStr = inputDate || new Date().toLocaleDateString("en-GB");
    const [day, month, year] = dateStr.split("/").map(Number);

    const alreadyPaidThisMonth = plan.payments.some((p) => {
      const [d, m, y] = p.date.split("/").map(Number);
      return p.type === "Fixed" && m === month && y === year;
    });

    if (alreadyPaidThisMonth) {
      alert(`⚠️ EMI already paid for ${month}/${year}. Use 'Excess Payment' for extra.`);
      return;
    }

    const emiToPay = Math.min(plan.monthlyEmi, remaining);
    if (emiToPay <= 0) {
      alert("✅ EMI already completed. No payment needed.");
      return;
    }

    addPayment(index, emiToPay, "Fixed", dateStr);
  };

  const handleExcessPayment = (index) => {
    const plan = plans[index];
    const totalPaid = getTotalPaid(plan.payments);
    const remaining = plan.totalAmount - totalPaid;

    if (remaining <= 0) {
      alert("🎉 EMI fully paid. No more Excess payments allowed.");
      return;
    }

    const amount = prompt("Enter excess amount:");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Invalid excess amount.");
      return;
    }

    const date = prompt("Enter date (dd/mm/yyyy) or leave blank for today:");
    addPayment(index, amount, "Excess", date);
  };

  const deletePlan = (id) => {
    if (window.confirm("Are you sure you want to delete this EMI plan?")) {
      const updated = plans.filter((plan) => plan.id !== id);
      savePlans(updated);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>📂 Existing EMI Plans</h2>
      <button onClick={goBack} style={styles.backBtn}>🔙 Back to Dashboard</button>

      {plans.length === 0 ? (
        <p>No EMI plans found.</p>
      ) : (
        plans.map((plan, index) => {
          const totalPaid = getTotalPaid(plan.payments);
          const remaining = getBalance(plan);
          const isFullyPaid = totalPaid >= plan.totalAmount;

          return (
            <div key={plan.id} style={styles.card}>
              <h3>{plan.title}</h3>
              <p>💰 Total Amount: ₹{plan.totalAmount}</p>
              <p>📅 Monthly EMI: ₹{plan.monthlyEmi}</p>
              <p>📆 Start Date: {plan.startDate}</p>
              <p>✅ Total Paid: ₹{totalPaid}</p>
              <p>📉 Remaining: ₹{remaining}</p>
              {isFullyPaid && <p style={{ color: "green", fontWeight: "bold" }}>🎉 EMI Over</p>}

              <button onClick={() => handleFixedPayment(index)} style={styles.payBtn}>
                ✅ Pay EMI
              </button>
              <button onClick={() => handleExcessPayment(index)} style={styles.excessBtn}>
                ➕ Add Excess Payment
              </button>

              <h4>📋 Payment History</h4>
              <table border="1" cellPadding="5">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Total Paid</th>
                    <th>To Be Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(plan.payments || []).map((pay, idx) => {
                    const runningTotal = plan.payments
                      .slice(0, idx + 1)
                      .reduce((sum, p) => sum + p.amount, 0);
                    const balance = Math.max(0, plan.totalAmount - runningTotal);

                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{pay.date}</td>
                        <td>₹{pay.amount}</td>
                        <td>
                          <span style={pay.type === "Fixed" ? styles.fixedBadge : styles.excessBadge}>
                            {pay.type}
                          </span>
                        </td>
                        <td>₹{runningTotal}</td>
                        <td>{balance === 0 ? "EMI Over" : `₹${balance}`}</td>
                      </tr>
                    );
                  })}
                  {(!plan.payments || plan.payments.length === 0) && (
                    <tr>
                      <td colSpan="6" align="center">No payments yet</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <button onClick={() => deletePlan(plan.id)} style={styles.deleteBtn}>
                🗑 Delete Plan
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "2rem",
    backgroundColor: "#f9f9f9",
  },
  backBtn: {
    padding: "8px 16px",
    marginBottom: "1rem",
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  payBtn: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "6px 12px",
    marginRight: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  excessBtn: {
    backgroundColor: "#ffc107",
    color: "black",
    padding: "6px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  fixedBadge: {
    padding: "4px 8px",
    backgroundColor: "#28a745",
    color: "white",
    borderRadius: "5px",
    fontSize: "0.9rem",
  },
  excessBadge: {
    padding: "4px 8px",
    backgroundColor: "#fd7e14",
    color: "white",
    borderRadius: "5px",
    fontSize: "0.9rem",
  },
  deleteBtn: {
    marginTop: "1rem",
    backgroundColor: "#dc3545",
    color: "white",
    padding: "8px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
