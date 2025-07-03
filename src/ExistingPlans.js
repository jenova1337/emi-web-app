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

  const addPayment = (planIndex, amount, type, customDate) => {
    const updatedPlans = [...plans];
    const plan = updatedPlans[planIndex];
    const payment = {
      date: customDate || new Date().toLocaleDateString("en-GB"),
      amount: parseFloat(amount),
      type,
    };
    plan.payments.push(payment);
    savePlans(updatedPlans);
  };

  const handleFixedPayment = (index) => {
    const updatedPlans = [...plans];
    const plan = updatedPlans[index];

    const inputDate = prompt("Enter date (dd/mm/yyyy) or leave blank for today:");
    const dateStr = inputDate || new Date().toLocaleDateString("en-GB");

    const [day, month, year] = dateStr.split("/").map(Number);

    const alreadyPaidThisMonth = plan.payments.some((p) => {
      const [d, m, y] = p.date.split("/").map(Number);
      return p.type === "Fixed" && m === month && y === year;
    });

    const payment = {
      date: dateStr,
      amount: plan.monthlyEmi,
      type: alreadyPaidThisMonth ? "Excess" : "Fixed",
    };

    plan.payments.push(payment);
    savePlans(updatedPlans);

    if (alreadyPaidThisMonth) {
      alert("Already paid EMI for this month. This has been added as Excess Payment.");
    }
  };

  const handleExcessPayment = (index) => {
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

  const getTotalPaid = (payments) =>
    payments.reduce((sum, p) => sum + p.amount, 0);

  const getBalance = (plan) =>
    plan.totalAmount - getTotalPaid(plan.payments);

  const hasPaidThisMonth = (plan) => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return plan.payments.some((p) => {
      const [d, m, y] = p.date.split("/").map(Number);
      return p.type === "Fixed" && m === month && y === year;
    });
  };

  const getNextDueDate = (plan) => {
    const start = new Date(plan.startDate.split("/").reverse().join("-"));
    const nextMonth = start.getMonth() + plan.payments.filter(p => p.type === "Fixed").length;
    const nextDue = new Date(start.setMonth(nextMonth));
    return nextDue.toLocaleDateString("en-GB");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>📂 Existing EMI Plans</h2>
      <button onClick={goBack} style={styles.backBtn}>🔙 Back to Dashboard</button>

      {plans.length === 0 ? (
        <p>No EMI plans found.</p>
      ) : (
        plans.map((plan, index) => (
          <div key={plan.id} style={styles.card}>
            <h3>{plan.title}</h3>
            <p>💰 Total Amount: ₹{plan.totalAmount}</p>
            <p>📅 Monthly EMI: ₹{plan.monthlyEmi}</p>
            <p>📆 Start Date: {plan.startDate}</p>
            <p>📆 Next Due: {getNextDueDate(plan)}</p>
            <p>✅ Total Paid: ₹{getTotalPaid(plan.payments)}</p>
            <p>📉 Remaining: ₹{getBalance(plan)}</p>
            <p>
              Status: {hasPaidThisMonth(plan) ? (
                <span style={styles.fixedBadge}>🟢 Paid this month</span>
              ) : (
                <span style={styles.overdueBadge}>🔴 Overdue</span>
              )}
            </p>

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
                  const balance = plan.totalAmount - runningTotal;

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
                      <td>₹{balance}</td>
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
        ))
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
  overdueBadge: {
    padding: "4px 8px",
    backgroundColor: "#dc3545",
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
