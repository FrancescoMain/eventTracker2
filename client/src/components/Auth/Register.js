import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }
    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri");
      return;
    }

    try {
      const body = { username, email, password };
      // The backend route is /api/auth/register
      const res = await axiosInstance.post("/auth/register", body);
      setSuccess("Registrazione completata! Effettua l'accesso.");
      // Optionally redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registrazione fallita. Riprova."
      );
      console.error("Registration error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Registrati</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={onSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="username">Nome utente</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={username}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="email">Indirizzo email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    minLength="6"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="confirmPassword">Conferma Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    minLength="6"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Registrati
                </button>
              </form>
              <p className="mt-3 text-center">
                Hai già un account? <Link to="/login">Accedi qui</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
