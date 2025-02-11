import { Component } from 'solid-js';
import { Title } from '@solidjs/meta';
import AuthGuard from '../components/AuthGuard/AuthGuard';

const Library: Component = () => {
  return (
    <AuthGuard>
      <div class="min-h-screen hero bg-base-200">
        <Title>Library - Ownifi</Title>
        <div class="hero-content text-center w-full">
          <div class="card bg-base-100 shadow-xl w-full max-w-4xl">
            <div class="card-body">
              <h1 class="card-title text-3xl justify-center mb-2">My Library</h1>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Library; 