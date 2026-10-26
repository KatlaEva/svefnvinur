import { BarChart3, LifeBuoy, Menu, Sun } from 'lucide-react';
import { useApp, type Tab } from '../AppContext';
import { is } from '../content/is';

const tabs: { id: Tab; label: string; Icon: typeof Sun }[] = [
  { id: 'today', label: is.tabs.today, Icon: Sun },
  { id: 'help', label: is.tabs.help, Icon: LifeBuoy },
  { id: 'progress', label: is.tabs.progress, Icon: BarChart3 },
  { id: 'more', label: is.tabs.more, Icon: Menu },
];

export function TabBar() {
  const { route, go } = useApp();
  return (
    <nav className="tabbar" aria-label="Aðalvalmynd">
      <ul>
        {tabs.map(({ id, label, Icon }) => (
          <li key={id}>
            <button
              type="button"
              className="tab"
              aria-current={route.tab === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon size={24} aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
