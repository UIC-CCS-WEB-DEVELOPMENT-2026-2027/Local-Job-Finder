import { useEffect, useRef, useState } from "react";
import "./AuthModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = [
  { value: "client", label: "Post Errand / Client" },
  { value: "runner", label: "Perform Errand / Runner" },
];

const ROLE_LABELS = {
  client: "Client / Errand Poster",
  runner: "Runner / Errand Performer",
};

const EMPTY_SIGN_UP = {
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  phone: "",
  role: "client",
  password: "",
  confirmPassword: "",
};

function formatBirthDate(value) {
  if (!value) return "Not provided";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function validateSignUp(form) {
  const next = {};

  if (!form.firstName.trim()) next.firstName = "First name is required.";
  if (!form.lastName.trim()) next.lastName = "Last name is required.";

  if (!form.email.trim()) next.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(form.email.trim())) {
    next.email = "Enter a valid email address.";
  }

  if (!form.birthDate) next.birthDate = "Birth date is required.";
  else if (new Date(form.birthDate) >= new Date()) {
    next.birthDate = "Birth date must be in the past.";
  }

  const phoneDigits = form.phone.replace(/\D/g, "");
  if (!form.phone.trim()) next.phone = "Phone number is required.";
  else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    next.phone = "Enter a valid phone number.";
  }

  if (!form.role) next.role = "Choose a role.";

  if (!form.password) next.password = "Password is required.";
  else if (form.password.length < 8)
    next.password = "Use at least 8 characters.";

  if (!form.confirmPassword) next.confirmPassword = "Confirm your password.";
  else if (form.confirmPassword !== form.password) {
    next.confirmPassword = "Passwords do not match.";
  }

  return next;
}

function EyeIcon({ visible }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible && <line x1="4" y1="20" x2="20" y2="4" />}
    </svg>
  );
}

export default function AuthModal({
  required = false,
  onClose,
  user,
  onLogin,
  onLogout,
  onSignUp,
  onRecover,
  onReset,
  onUpdateUser,
}) {
  const [view, setView] = useState("login");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [signUpForm, setSignUpForm] = useState(EMPTY_SIGN_UP);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [pictureError, setPictureError] = useState("");
  const pictureInputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !required) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, required]);

  function goTo(nextView) {
    setView(nextView);
    setErrors({});
    setFormError("");
    setNotice("");
    setShowPassword(false);
    setShowConfirm(false);
    setResetForm({ password: "", confirmPassword: "" });
  }

  const inputClass = (field) =>
    errors[field] ? "auth-input has-error" : "auth-input";

  function changeLogin(field, value) {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
  }

  function changeSignUp(field, value) {
    setSignUpForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const nextErrors = {};
    if (!EMAIL_PATTERN.test(loginForm.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!loginForm.password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await onLogin({
        email: loginForm.email,
        password: loginForm.password,
      });
      setLoginForm((prev) => ({ ...prev, password: "" }));
      setErrors({});
    } catch (error) {
      setFormError(
        error.message || "Incorrect email or password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const nextErrors = validateSignUp(signUpForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await onSignUp(signUpForm);
      setSignUpForm(EMPTY_SIGN_UP);
      setErrors({});
      setShowPassword(false);
      setShowConfirm(false);
    } catch (error) {
      const message = error.message || "Could not create account.";
      if (/already|registered|exists/i.test(message)) {
        setErrors({ email: "That email is already registered." });
      } else {
        setFormError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRecover(event) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setNotice("");

    const email = recoverEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setBusy(true);
    try {
      const result = await onRecover(email);
      if (result?.mode === "email-sent") {
        setNotice("Password reset link sent to your email!");
        setView("login");
      } else {
        setNotice("Password reset link sent to your email!");
        setView("reset");
      }
    } catch (error) {
      setErrors({
        email: error.message || "No account was found with that email address.",
      });
    } finally {
      setBusy(false);
    }
  }

  function changeReset(field, value) {
    setResetForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError("");
  }

  async function handleReset(event) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const nextErrors = {};
    if (!resetForm.password) nextErrors.password = "Password is required.";
    else if (resetForm.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (!resetForm.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (resetForm.confirmPassword !== resetForm.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await onReset({
        email: recoverEmail,
        password: resetForm.password,
      });
      setLoginForm({
        email: recoverEmail.trim().toLowerCase(),
        password: "",
        remember: false,
      });
      setRecoverEmail("");
      setResetForm({ password: "", confirmPassword: "" });
      setErrors({});
      setView("login");
      setNotice("Password updated. Log in with your new password.");
    } catch (error) {
      setFormError(error.message || "That account could not be found.");
    } finally {
      setBusy(false);
    }
  }

  function handlePictureChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPictureError("Choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPictureError("Choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setPictureError("");
        await onUpdateUser({ picture: reader.result });
      } catch (error) {
        setPictureError(error.message || "Could not update photo.");
      }
    };
    reader.readAsDataURL(file);
  }

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`
    : "";

  const title = user
    ? "Your account"
    : view === "signup"
      ? "Sign up"
      : view === "recover"
        ? "Reset your password"
        : view === "reset"
          ? "Set a new password"
          : "Login to your account";

  return (
    <div
      className={`auth-overlay${required ? " auth-overlay-required" : ""}`}
      onClick={required ? undefined : onClose}
      role="presentation"
    >
      <div
        className="auth-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-actions">
          {user && (
            <button type="button" className="auth-logout" onClick={onLogout}>
              Log Out
            </button>
          )}

          {!required && (
            <button
              type="button"
              className="auth-close"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>

        <p className="auth-brand">Localified</p>
        {required && !user && (
          <p className="auth-gate-note">
            Sign in to continue to the job board.
          </p>
        )}

        {user && (
          <div className="auth-profile">
            <div className="auth-picture">
              {user.picture ? (
                <img
                  className="auth-picture-img"
                  src={user.picture}
                  alt={`${user.firstName} ${user.lastName}`}
                />
              ) : (
                <span className="auth-picture-fallback" aria-hidden="true">
                  {initials}
                </span>
              )}

              <input
                ref={pictureInputRef}
                className="auth-picture-input"
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
              />
              <button
                type="button"
                className="auth-picture-btn"
                onClick={() => pictureInputRef.current?.click()}
              >
                Change photo
              </button>

              {pictureError && (
                <span className="auth-error">{pictureError}</span>
              )}
            </div>

            <h1 className="auth-title">Welcome back, {user.firstName}!</h1>
            <p className="auth-subtitle">
              Here is a summary of your Localified account.
            </p>

            <dl className="auth-details">
              <div className="auth-detail">
                <dt>Full name</dt>
                <dd>
                  {user.firstName} {user.lastName}
                </dd>
              </div>
              <div className="auth-detail">
                <dt>Account role</dt>
                <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
              </div>
              <div className="auth-detail">
                <dt>Email address</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="auth-detail">
                <dt>Phone number</dt>
                <dd>{user.phone || "Not provided"}</dd>
              </div>
              <div className="auth-detail">
                <dt>Birth date</dt>
                <dd>{formatBirthDate(user.birthDate)}</dd>
              </div>
            </dl>
          </div>
        )}

        {!user && view === "login" && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <h1 className="auth-title">Login to your account</h1>
            <p className="auth-subtitle">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => goTo("signup")}
              >
                Sign Up here!!
              </button>
            </p>

            {notice && <p className="auth-banner success">{notice}</p>}
            {formError && <p className="auth-banner error">{formError}</p>}

            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className={inputClass("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={loginForm.email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => changeLogin("email", event.target.value)}
              />
              {errors.email && (
                <span className="auth-error">{errors.email}</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className={inputClass("password")}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={loginForm.password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) =>
                  changeLogin("password", event.target.value)
                }
              />
              {errors.password && (
                <span className="auth-error">{errors.password}</span>
              )}
            </div>

            <div className="auth-controls">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={loginForm.remember}
                  onChange={(event) =>
                    changeLogin("remember", event.target.checked)
                  }
                />
                Remember me
              </label>
              <button
                type="button"
                className="auth-link"
                onClick={() => goTo("recover")}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "Logging in\u2026" : "Login with email"}
            </button>
          </form>
        )}

        {!user && view === "signup" && (
          <form className="auth-form" onSubmit={handleSignUp} noValidate>
            <h1 className="auth-title">Sign up</h1>
            <p className="auth-subtitle">
              Pick a role and start posting or running errands.
            </p>

            {formError && <p className="auth-banner error">{formError}</p>}

            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="signup-first">First name</label>
                <input
                  id="signup-first"
                  className={inputClass("firstName")}
                  type="text"
                  autoComplete="given-name"
                  value={signUpForm.firstName}
                  aria-invalid={Boolean(errors.firstName)}
                  onChange={(event) =>
                    changeSignUp("firstName", event.target.value)
                  }
                />
                {errors.firstName && (
                  <span className="auth-error">{errors.firstName}</span>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="signup-last">Last name</label>
                <input
                  id="signup-last"
                  className={inputClass("lastName")}
                  type="text"
                  autoComplete="family-name"
                  value={signUpForm.lastName}
                  aria-invalid={Boolean(errors.lastName)}
                  onChange={(event) =>
                    changeSignUp("lastName", event.target.value)
                  }
                />
                {errors.lastName && (
                  <span className="auth-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                className={inputClass("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={signUpForm.email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => changeSignUp("email", event.target.value)}
              />
              {errors.email && (
                <span className="auth-error">{errors.email}</span>
              )}
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="signup-birth">Birth date</label>
                <input
                  id="signup-birth"
                  className={inputClass("birthDate")}
                  type="date"
                  autoComplete="bday"
                  value={signUpForm.birthDate}
                  aria-invalid={Boolean(errors.birthDate)}
                  onChange={(event) =>
                    changeSignUp("birthDate", event.target.value)
                  }
                />
                {errors.birthDate && (
                  <span className="auth-error">{errors.birthDate}</span>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="signup-phone">Phone number</label>
                <input
                  id="signup-phone"
                  className={inputClass("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0917 123 4501"
                  value={signUpForm.phone}
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(event) =>
                    changeSignUp("phone", event.target.value)
                  }
                />
                {errors.phone && (
                  <span className="auth-error">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-role">I want to</label>
              <select
                id="signup-role"
                className={inputClass("role")}
                value={signUpForm.role}
                onChange={(event) => changeSignUp("role", event.target.value)}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && <span className="auth-error">{errors.role}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-password">
                <input
                  id="signup-password"
                  className={inputClass("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={signUpForm.password}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) =>
                    changeSignUp("password", event.target.value)
                  }
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {errors.password && (
                <span className="auth-error">{errors.password}</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="auth-password">
                <input
                  id="signup-confirm"
                  className={inputClass("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={signUpForm.confirmPassword}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  onChange={(event) =>
                    changeSignUp("confirmPassword", event.target.value)
                  }
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="auth-error">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "Creating account\u2026" : "Sign Up"}
            </button>

            <p className="auth-footer">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => goTo("login")}
              >
                Log In
              </button>
            </p>
          </form>
        )}

        {!user && view === "recover" && (
          <form className="auth-form" onSubmit={handleRecover} noValidate>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">
              Enter your registered email address and we&apos;ll send you a
              password reset link.
            </p>

            {notice && <p className="auth-banner success">{notice}</p>}
            {formError && <p className="auth-banner error">{formError}</p>}

            <div className="auth-field">
              <label htmlFor="recover-email">Email address</label>
              <input
                id="recover-email"
                className={inputClass("email")}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={recoverEmail}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => {
                  setRecoverEmail(event.target.value);
                  setErrors({});
                  setFormError("");
                }}
              />
              {errors.email && (
                <span className="auth-error">{errors.email}</span>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "Sending\u2026" : "Send Reset Link"}
            </button>

            <p className="auth-footer">
              <button
                type="button"
                className="auth-link"
                onClick={() => goTo("login")}
              >
                Back to Login
              </button>
            </p>
          </form>
        )}

        {!user && view === "reset" && (
          <form className="auth-form" onSubmit={handleReset} noValidate>
            <h1 className="auth-title">Set a new password</h1>
            <p className="auth-subtitle">
              Choose a new password for {recoverEmail.trim()}.
            </p>

            {notice && <p className="auth-banner success">{notice}</p>}
            {formError && <p className="auth-banner error">{formError}</p>}

            <div className="auth-field">
              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                className={inputClass("password")}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={resetForm.password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) =>
                  changeReset("password", event.target.value)
                }
              />
              {errors.password && (
                <span className="auth-error">{errors.password}</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="reset-confirm">Confirm new password</label>
              <input
                id="reset-confirm"
                className={inputClass("confirmPassword")}
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your new password"
                value={resetForm.confirmPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                onChange={(event) =>
                  changeReset("confirmPassword", event.target.value)
                }
              />
              {errors.confirmPassword && (
                <span className="auth-error">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "Updating\u2026" : "Update Password"}
            </button>

            <p className="auth-footer">
              <button
                type="button"
                className="auth-link"
                onClick={() => goTo("login")}
              >
                Back to Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
