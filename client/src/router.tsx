import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Layout & Guards
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { OnboardingGuard } from './components/layout/OnboardingGuard';
import { PublicOnlyRoute } from './components/layout/PublicOnlyRoute';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

// Public & Auth Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';

// App Feature Pages
import { Dashboard } from './pages/Dashboard';
import { Farms } from './pages/Farms';
import { FarmNew } from './pages/FarmNew';
import { FarmDetail } from './pages/FarmDetail';
import { AdvisoryNew } from './pages/AdvisoryNew';
import { AdvisoryDetail } from './pages/AdvisoryDetail';
import { Recommend } from './pages/Recommend';
import { RecommendDetail } from './pages/RecommendDetail';
import { Diagnose } from './pages/Diagnose';
import { DiagnoseDetail } from './pages/DiagnoseDetail';
import { Fertilizer } from './pages/Fertilizer';
import { FertilizerDetail } from './pages/FertilizerDetail';
import { Assistant } from './pages/Assistant';
import { AssistantThread } from './pages/AssistantThread';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  // Public Landing
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Landing />
      </ErrorBoundary>
    ),
  },

  // Auth Routes (Redirect to dashboard if already logged in)
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '/signup',
    element: (
      <ErrorBoundary>
        <PublicOnlyRoute>
          <SignUp />
        </PublicOnlyRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <ErrorBoundary>
        <VerifyEmail />
      </ErrorBoundary>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <ErrorBoundary>
        <ForgotPassword />
      </ErrorBoundary>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ErrorBoundary>
        <ResetPassword />
      </ErrorBoundary>
    ),
  },

  // Onboarding Wizard
  {
    path: '/onboarding',
    element: (
      <ErrorBoundary>
        <OnboardingGuard>
          <Onboarding />
        </OnboardingGuard>
      </ErrorBoundary>
    ),
  },

  // Authenticated App Routes inside AppShell
  {
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      </ErrorBoundary>
    ),
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/farms',
        element: <Farms />,
      },
      {
        path: '/farms/new',
        element: <FarmNew />,
      },
      {
        path: '/farms/:farmId',
        element: <FarmDetail />,
      },
      {
        path: '/advisory/new',
        element: <AdvisoryNew />,
      },
      {
        path: '/advisory/:id',
        element: <AdvisoryDetail />,
      },
      {
        path: '/recommend',
        element: <Recommend />,
      },
      {
        path: '/recommend/:id',
        element: <RecommendDetail />,
      },
      {
        path: '/diagnose',
        element: <Diagnose />,
      },
      {
        path: '/diagnose/:id',
        element: <DiagnoseDetail />,
      },
      {
        path: '/fertilizer',
        element: <Fertilizer />,
      },
      {
        path: '/fertilizer/:id',
        element: <FertilizerDetail />,
      },
      {
        path: '/assistant',
        element: <Assistant />,
      },
      {
        path: '/assistant/:sessionId',
        element: <AssistantThread />,
      },
      {
        path: '/history',
        element: <History />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
    ],
  },

  // 404 Catch-All
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <NotFound />
      </ErrorBoundary>
    ),
  },
]);
