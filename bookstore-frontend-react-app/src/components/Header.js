import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown, Image } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { isAdmin } from '../service/CommonUtils';
import { logout } from '../actions/userActions';
import './Header.css';

const Header = () => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const dispatch = useDispatch();

  // Thêm effect để xử lý sự kiện scroll
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.bookstore-navbar');
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const logoutHandler = () => {
    dispatch(logout());
  };

  return (
    <header>
      <Navbar 
        expand="lg" 
        fixed="top" 
        className="bookstore-navbar shadow-sm" 
        style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.5rem 2rem',
          minHeight: '60px'
        }}
      >
        <Container fluid>
          {/* Logo bên trái */}
          <Navbar.Brand 
            as={Link} 
            to="/" 
            style={{ 
              fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              color: '#1e40af', 
              fontSize: '1.75rem',
              fontWeight: '700',
              lineHeight: '1.2',
              letterSpacing: '-0.025em',
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#2563eb';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#1e40af';
              e.target.style.transform = 'scale(1)';
            }}
          >
            BookStore
          </Navbar.Brand>
          
          {/* Nút toggle cho màn hình nhỏ */}
          <Navbar.Toggle aria-controls="navbar-nav" style={{ border: 'none' }} />

          {/* Các thẻ nav bên phải */}
          <Navbar.Collapse id="navbar-nav" style={{justifyContent: 'flex-end' }}> 
            <Nav className="ms-auto d-flex align-items-center" style={{ gap: '1rem', justifyContent: 'flex-end' }}>
              {/* Giỏ hàng */}
              <Nav.Link 
                as={Link} 
                to="/cart" 
                className="nav-item-custom"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  color: '#475569',
                  fontWeight: '500',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  letterSpacing: '-0.01em',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#1e40af';
                  e.target.style.backgroundColor = '#f0f9ff';
                  e.target.style.borderColor = '#bfdbfe';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#475569';
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <i className="fas fa-shopping-cart" style={{ marginRight: '0.5rem' }}></i>
                <span>Giỏ hàng</span>
              </Nav.Link>

              {/* Người dùng đã đăng nhập */}
              {userInfo ? (
                <NavDropdown
                  title={
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#475569',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      <i className="fas fa-user-circle" style={{ marginRight: '0.5rem' }}></i>
                      <span>{userInfo.userName}</span>
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                  className="custom-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/userProfile">
                    <i className="fas fa-id-card me-2"></i>&nbsp; Hồ sơ
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={logoutHandler}>
                    <i className="fas fa-sign-out-alt me-2"></i>&nbsp; Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className="nav-item-custom"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    color: '#475569',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#1e40af';
                    e.target.style.backgroundColor = '#f0f9ff';
                    e.target.style.borderColor = '#bfdbfe';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#475569';
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = 'transparent';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fas fa-sign-in-alt" style={{ marginRight: '0.5rem' }}></i>
                  <span>Đăng nhập</span>
                </Nav.Link>
              )}

              {/* Quản trị viên */}
              {userInfo && isAdmin() && (
                <NavDropdown
                  title={
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: '#475569',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}>
                      <i className="fas fa-cog" style={{ marginRight: '0.5rem' }}></i>
                      <span>Quản trị</span>
                    </span>
                  }
                  id="admin-dropdown"
                  align="end"
                  className="custom-dropdown"
                >
                  <NavDropdown.Item as={Link} to="/admin/userlist">
                    <i className="fas fa-users me-2"></i> Người dùng
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/productlist">
                    <i className="fas fa-book me-2"></i> Sản phẩm
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/orderlist">
                    <i className="fas fa-clipboard-list me-2"></i> Đơn hàng
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
 
    </header>
  );
};

export default Header;