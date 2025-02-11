import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { auth } from '../../lib/auth';

const Navbar: Component = () => {
  return (
    <div class="navbar bg-base-100">
      <div class="flex-1">
        <A href="/" class="btn btn-ghost text-xl">Ownifi</A>
      </div>
      <div class="flex-none">
        {auth.isAuthenticated() && (
          <ul class="menu menu-horizontal px-1">
            <li><A href="/library" activeClass="active">Library</A></li>
            <li><A href="/account" activeClass="active">Account</A></li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Navbar; 