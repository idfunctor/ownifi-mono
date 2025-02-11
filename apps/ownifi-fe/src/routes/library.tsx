import { Component, createResource, For, Show } from 'solid-js';
import { Title } from '@solidjs/meta';
import AuthGuard from '../components/AuthGuard/AuthGuard';
import { library } from '../utils/libraryClient';

const fetchTracks = async () => {
  const res = await library.tracks.$get({
    query: {
      limit: '50',
      offset: '0'
    }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch tracks');
  }

  const data = await res.json();
  if ('error' in data) {
    throw new Error((data).error);
  }

  return data;
};

const Library: Component = () => {
  const [tracks] = createResource(fetchTracks);

  return (
    <AuthGuard>
      <div class="min-h-screen hero bg-base-200">
        <Title>Library - Ownifi</Title>
        <div class="hero-content text-center w-full">
          <div class="card bg-base-100 shadow-xl w-full max-w-4xl">
            <div class="card-body">
              <h1 class="card-title text-3xl justify-center mb-2">My Library</h1>

              {tracks.loading && <div class="loading loading-spinner loading-lg"></div>}

              {tracks.error && (
                <div class="alert alert-error">
                  <span>Failed to load tracks: {tracks.error.message}</span>
                </div>
              )}

              <Show when={tracks()}>
                <div class="flex flex-col gap-2">
                  <For each={tracks()?.tracks}>
                    {(track) => (
                      <div class="card bg-base-200">
                        <div class="card-body py-4">
                          <h2 class="card-title">{track.track.name}</h2>
                          <p class="text-sm opacity-75">
                            {track.track.artists.map(a => a.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Library;