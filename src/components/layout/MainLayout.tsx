import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { marketplaceConfig } from "@/config/marketplace.config";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Plus, 
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 glass">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">
              {marketplaceConfig.APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/listings" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse {marketplaceConfig.ITEM_LABEL_PLURAL}
            </Link>
            {user && (
              <Link 
                to="/dashboard" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <>
                {/* Create Listing Button */}
                <Button 
                  onClick={() => navigate("/listings/new")} 
                  className="hidden sm:flex gap-2 bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Create {marketplaceConfig.ITEM_LABEL}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/listings/new")} className="sm:hidden">
                      <Plus className="mr-2 h-4 w-4" />
                      Create {marketplaceConfig.ITEM_LABEL}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/auth?mode=signup")} 
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background">
            <nav className="container py-4 flex flex-col gap-2">
              <Link 
                to="/listings" 
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse {marketplaceConfig.ITEM_LABEL_PLURAL}
              </Link>
              {user && (
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {marketplaceConfig.APP_NAME}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
