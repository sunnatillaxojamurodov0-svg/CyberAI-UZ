import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn().mockReturnValue(''),
  })),
});

HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  })
);

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn(() => ({
    component: vi.fn(),
    loader: vi.fn(),
    head: vi.fn(),
  })),
  createRootRouteWithContext: vi.fn(() => ({
    component: vi.fn(),
    shellComponent: vi.fn(),
    notFoundComponent: vi.fn(),
    errorComponent: vi.fn(),
    head: vi.fn(),
  })),
  Link: vi.fn(({ children, ...props }) => {
    const { createElement } = require('react');
    return createElement('a', props, children);
  }),
  Outlet: vi.fn(() => null),
  useRouter: vi.fn(() => ({
    invalidate: vi.fn(),
    navigate: vi.fn(),
  })),
  HeadContent: vi.fn(() => null),
  Scripts: vi.fn(() => null),
}));
