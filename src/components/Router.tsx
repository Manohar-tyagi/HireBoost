import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';

// Import pages
import HomePage from '@/components/pages/HomePage';
import FAQPage from '@/components/pages/FAQPage';
import MySessionsPage from '@/components/pages/MySessionsPage';
import ResumeReviewPage from '@/components/pages/ResumeReviewPage';
import MockInterviewPage from '@/components/pages/MockInterviewPage';
import WritingAssistantPage from '@/components/pages/WritingAssistantPage';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "faq",
        element: <FAQPage />,
      },
      {
        path: "my-sessions",
        element: <MySessionsPage />,
      },
      {
        path: "resume-review",
        element: <ResumeReviewPage />,
      },
      {
        path: "resume-review/:id",
        element: <ResumeReviewPage />,
      },
      {
        path: "mock-interview",
        element: <MockInterviewPage />,
      },
      {
        path: "mock-interview/:id",
        element: <MockInterviewPage />,
      },
      {
        path: "writing-assistant",
        element: <WritingAssistantPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
