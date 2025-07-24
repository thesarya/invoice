import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Building2
} from "lucide-react";

interface NavigationProps {
  selectedCentre: 'GKP' | 'Lucknow';
  onCentreChange: (centre: 'GKP' | 'Lucknow') => void;
}

const Navigation: React.FC<NavigationProps> = ({ selectedCentre, onCentreChange }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Invoices',
      icon: Receipt,
      description: 'Payment Management'
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
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Therapy Center</h1>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            </div>
          </div>

          {/* Centre Selection */}
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

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                asChild
                variant={isActive(item.path) ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center gap-2"
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 