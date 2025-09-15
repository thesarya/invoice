import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Building2,
  Settings,
  Home,
  LogOut
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  selectedCentre: 'GKP' | 'Lucknow' | 'Settings';
  onCentreChange: (centre: 'GKP' | 'Lucknow') => void;
}

const Navigation: React.FC<NavigationProps> = ({ selectedCentre, onCentreChange }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: Home,
      description: 'Invoice Management'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'API Configuration'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Aaryavart Centre</h1>
                <p className="text-xs text-gray-500">Invoice Management</p>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Centre Selection and User Info */}
          <div className="flex items-center gap-4">
            {/* Centre Selection - Only show on dashboard */}
            {selectedCentre !== 'Settings' && (
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedCentre === 'GKP' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCentreChange('GKP')}
                >
                  GKP
                </Button>
                <Button
                  variant={selectedCentre === 'Lucknow' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCentreChange('Lucknow')}
                >
                  Lucknow
                </Button>
              </div>
            )}
            
            {/* User Info and Logout */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;