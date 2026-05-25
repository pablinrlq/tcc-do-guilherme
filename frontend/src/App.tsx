/** Composição da aplicação: providers + tabela de rotas. */
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RedirectIfAuthed, RequireAuth } from './components/guards';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

import { Admin } from './pages/Admin';
import { EditProfile } from './pages/EditProfile';
import { Favorites } from './pages/Favorites';
import { Feed } from './pages/Feed';
import { ForgotPassword } from './pages/ForgotPassword';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Notifications } from './pages/Notifications';
import { Onboarding } from './pages/Onboarding';
import { Privacy } from './pages/Privacy';
import { Profile } from './pages/Profile';
import { Ranking } from './pages/Ranking';
import { Register } from './pages/Register';
import { RequestDetail } from './pages/RequestDetail';
import { RequestNew } from './pages/RequestNew';
import { Requests } from './pages/Requests';
import { ResetPassword } from './pages/ResetPassword';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Skills } from './pages/Skills';
import { Terms } from './pages/Terms';
import { Trends } from './pages/Trends';
import { Wallet } from './pages/Wallet';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<RedirectIfAuthed />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Rotas protegidas */}
            <Route element={<RequireAuth />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<AppLayout />}>
                <Route path="/feed" element={<Feed />} />
                <Route path="/search" element={<Search />} />
                <Route path="/trends" element={<Trends />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/:id" element={<RequestDetail />} />
                <Route path="/request/new/:id" element={<RequestNew />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
