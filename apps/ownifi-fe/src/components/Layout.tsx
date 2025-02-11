import { Component, JSX } from 'solid-js';
import Navbar from './Navbar/Navbar';

interface LayoutProps {
  children: JSX.Element;
}

const Layout: Component<LayoutProps> = (props) => {
  return (
    <div class="min-h-screen bg-base-100">
      <Navbar />
      {props.children}
    </div>
  );
};

export default Layout; 