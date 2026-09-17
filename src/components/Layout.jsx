import './Layout.css'
import UserMenu from './UserMenu'

export default function Layout({ children, title, subtitle, showUserMenu = true }) {
  return (
    <div className="layout-page">
      <div className="layout-card">
        <div className="layout-header">
          {showUserMenu && <UserMenu />}
          <h1 className="layout-title">
            {title || "Calash Studio"}
          </h1>
          <p className="layout-subtitle">
            {subtitle || "Painel de Gerenciamento e Atendimento"}
          </p>
        </div>

        <div className="layout-content">
          {children}
        </div>

      </div>
    </div>
  )
}