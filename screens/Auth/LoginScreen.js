import { useContext, useState } from "react";

import AuthContent from "../../components/Auth/AuthContent";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import { AuthContext } from "../../context/AuthContext";

export default function LoginScreen() {
  const authContext = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loginHandler = async ({ email, password }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authContext.login(email, password);
    } catch (loginError) {
      setError(loginError.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <ErrorOverlay message={error} onRetry={() => setError(null)} retryLabel="Back" />;
  }

  return <AuthContent isLogin onAuthenticate={loginHandler} isSubmitting={isSubmitting} />;
}
