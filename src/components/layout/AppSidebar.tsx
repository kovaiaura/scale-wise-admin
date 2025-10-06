import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scale,
  FileText,
  BarChart3,
  Settings,
  Truck,
  Users,
  Package,
  Weight,
  Hash,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
  { title: 'Operator Console', url: '/operator', icon: Scale, roles: ['super_admin', 'admin', 'operator'] },
  { title: 'Weighments', url: '/weighments', icon: FileText, roles: ['super_admin', 'admin', 'operator'] },
  { title: 'Reports', url: '/reports', icon: BarChart3, roles: ['super_admin', 'admin', 'operator'] },
];

const masterNavItems = [
  { title: 'Vehicles', url: '/masters/vehicles', icon: Truck },
  { title: 'Parties', url: '/masters/parties', icon: Users },
  { title: 'Materials', url: '/masters/products', icon: Package },
];

const settingsNavItems = [
  { title: 'Weighbridge', url: '/settings/weighbridge', icon: Weight, roles: ['super_admin'] },
  { title: 'Serial Number', url: '/settings/serial-number', icon: Hash, roles: ['super_admin', 'admin'] },
  { title: 'Users', url: '/settings/users', icon: Users, roles: ['super_admin'] },
  { title: 'Profile', url: '/settings/profile', icon: Settings, roles: ['super_admin', 'admin'] },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Weight className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">WeighBridge</h1>
                <p className="text-xs text-sidebar-foreground/60">Pro System</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems
                .filter((item) => item.roles.includes(user?.role || ''))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Masters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {masterNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsNavItems
                  .filter((item) => item.roles.includes(user?.role || ''))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <NavLink to={item.url}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
