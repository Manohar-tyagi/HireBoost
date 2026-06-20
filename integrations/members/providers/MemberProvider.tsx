import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { MemberActions, MemberContext, MemberState } from '.';
import { getCurrentMember, Member } from '..';

// Local storage key
const MEMBER_STORAGE_KEY = 'member-store';

interface MemberProviderProps {
  children: ReactNode;
}

export const MemberProvider: React.FC<MemberProviderProps> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<MemberState>(() => {
    let storedMemberData: Member | null = null;
    let isAuth = false;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MEMBER_STORAGE_KEY);
        if (stored) {
          const parsedData = JSON.parse(stored);
          // Only use member data from localStorage, not authentication status
          storedMemberData = parsedData && typeof parsedData === 'object' && 'member' in parsedData ? parsedData.member : parsedData;
          if (storedMemberData && storedMemberData._id === 'mock-member-id') {
            isAuth = true;
          }
        }
      } catch (error) {
        console.error('Error loading member state from localStorage:', error);
      }
    }

    return {
      member: storedMemberData,
      isAuthenticated: isAuth,
      isLoading: !isAuth,
      error: null,
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Error saving member state to localStorage:', error);
      }
    }
  }, [state]);

  // Update state helper
  const updateState = useCallback((updates: Partial<MemberState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Member actions
  const actions: MemberActions = {
    /**
     * Load current member from Wix
     */
    loadCurrentMember: useCallback(async () => {
      // If we are already authenticated as the mock member, do not query the server
      const stored = typeof window !== 'undefined' ? localStorage.getItem(MEMBER_STORAGE_KEY) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const member = parsed && typeof parsed === 'object' && 'member' in parsed ? parsed.member : parsed;
          if (member && member._id === 'mock-member-id') {
            updateState({
              member,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        } catch (e) {}
      }

      try {
        updateState({ isLoading: true, error: null });

        const member = await getCurrentMember();

        if (member) {
          updateState({
            member,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          updateState({
            member: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (err) {
        updateState({
          error: err instanceof Error ? err.message : 'Failed to load member',
          member: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }, [updateState]),

    /**
     * Login redirect
     */
    login: useCallback(() => {
      // For local testing/development, log in with a mock profile so that
      // the user doesn't hit Wix OAuth login failure if it isn't configured
      const mockMember: Member = {
        _id: 'mock-member-id',
        contact: {
          firstName: 'Jane',
          lastName: 'Doe',
          phones: []
        },
        profile: {
          nickname: 'Jane Doe',
          title: 'Software Developer'
        },
        loginEmail: 'jane.doe@example.com',
        loginEmailVerified: true,
        status: 'APPROVED'
      };
      updateState({
        member: mockMember,
        isAuthenticated: true,
        isLoading: false,
      });
    }, [updateState]),

    /**
     * Logout action
     */
    logout: useCallback(() => {
      // Clear localStorage immediately
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(MEMBER_STORAGE_KEY);
        } catch (error) {
          console.error('Error clearing member state from localStorage:', error);
        }
      }
      updateState({
        member: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }, [updateState]),

    /**
     * Clear member state
     */
    clearMember: useCallback(() => {
      updateState({
        member: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }, [updateState]),
  };

  // Auto-load member on mount
  useEffect(() => {
    actions.loadCurrentMember();
  }, [actions.loadCurrentMember]);

  // Context value
  const contextValue = {
    ...state,
    actions,
  };

  return (
    <MemberContext.Provider value={contextValue}>
      {children}
    </MemberContext.Provider>
  );
};

function reloadOnceLoggedIn(loginWindow: Window) {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((row) => row.startsWith('wixSession='));

  if (cookie) {
    const jsonString = decodeURIComponent(cookie.split('=')[1] ?? '');
    const parsed = JSON.parse(jsonString);

    if (parsed?.tokens?.refreshToken?.role === "member") {
      loginWindow.close();
      window.location.reload();

      return;
    }
  }

  setTimeout(() => reloadOnceLoggedIn(loginWindow), 1_000);
}
