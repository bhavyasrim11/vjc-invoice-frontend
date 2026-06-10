const Topbar = () => {
  return (
    <div
      style={{
        height: "75px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",

        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      <input
        type="text"
        placeholder="Search Customers..."
        style={{
          width: "380px",
          padding: "12px 16px",
          border: "1px solid #d1d5db",
          borderRadius: "10px",
          outline: "none",
          fontSize: "15px",
        }}
      />

      <h3
        style={{
          margin: 0,
          fontWeight: "600",
          fontSize: "24px",
          color: "#111827",
        }}
      >
        VJC Invoice Dashboard
      </h3>
    </div>
  );
};

export default Topbar;