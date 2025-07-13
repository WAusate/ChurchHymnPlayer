import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Church } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: string[];
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Layout({ 
  children, 
  title = "App Hinos", 
  breadcrumbs, 
  showBackButton = false,
  onBackClick 
}: LayoutProps) {
  const [location, navigate] = useLocation();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-church-bg">
      <header className="shadow-lg" style={{ background: 'linear-gradient(90deg, #0F2247, #4DB4E7)' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="mr-4 text-white hover:text-white hover:bg-white/10 p-4 rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              )}
              <h1 className="text-xl md:text-2xl font-bold text-white" style={{ fontSize: '20px' }}>
                {title}
              </h1>
            </div>
            <div className="text-white">
              <Church className="h-8 w-8" />
            </div>
          </div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mt-2 text-church-light text-sm">
              <span>Início</span>
              {breadcrumbs.map((crumb, index) => (
                <span key={index}>
                  <span className="mx-2">›</span>
                  <span>{crumb}</span>
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
