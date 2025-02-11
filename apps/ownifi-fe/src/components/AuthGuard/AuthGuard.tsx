import { Component, JSX, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { auth } from '../../lib/auth';

interface AuthGuardProps {
  children: JSX.Element;
}

const AuthGuard: Component<AuthGuardProps> = (props) => {
  const navigate = useNavigate();

  // Only redirect if we've initialized auth and there's no user
  const shouldRedirect = () => auth.isInitialized() && !auth.isAuthenticated();
  if (shouldRedirect()) {
    navigate('/login');
  }

  // Show children only when we have a user
  return (
    <Show when={auth.isAuthenticated()}>
      {props.children}
    </Show>
  );
};

export default AuthGuard; 