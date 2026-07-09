function Alert({ type, message }) {
  const styles = {
    success: { color: "green" },
    error: { color: "red" },
    warning: { color: "orange" }
  };

  return <div style={styles[type]}>{message}</div>;
}
export default Alert;