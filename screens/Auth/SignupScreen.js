import { useContext, useState } from "react";

import AuthContent from "../../components/Auth/AuthContent";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import { AuthContext } from "../../context/AuthContext";

export default function SignupScreen() {
  const authContext = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const signupHandler = async ({ email, password }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authContext.signup(email, password);
    } catch (signupError) {
      setError(signupError.message || "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <ErrorOverlay message={error} onRetry={() => setError(null)} retryLabel="Back" />;
  }

  return <AuthContent isLogin={false} onAuthenticate={signupHandler} isSubmitting={isSubmitting} />;
}
