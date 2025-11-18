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
        <Navbar expand="lg" fixed="top" className="bookstore-navbar bg-light shadow-sm" style={{ paddingLeft: '10rem', paddingRight: '10rem' }}
>
  <Container fluid>
    {/* Logo bên trái */}
    <Navbar.Brand as={Link} to="/" className="fw-bold" style={{ color: '#1e3a8a' }}>
      BookStore
    </Navbar.Brand>
    {/* Nút toggle cho màn hình nhỏ */}
    <Navbar.Toggle aria-controls="navbar-nav" />

    {/* Các thẻ nav bên phải */}
    <Navbar.Collapse style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} id="navbar-nav">
      <Nav className="ms-auto align-items-center">
        {/* Giỏ hàng */}
        <Nav.Link as={Link} to="/cart" className="d-flex align-items-center">
          <i className="fas fa-shopping-cart me-1"></i>
          <span className="fw-bold"> Giỏ hàng</span>
        </Nav.Link>

        {/* Người dùng đã đăng nhập */}
        {userInfo ? (
          <NavDropdown
            title={
              <span className="d-flex align-items-center">
                <i className="fas fa-user-circle me-1"></i>
                <span className="fw-bold"> {userInfo.userName}</span>
              </span>
            }
            id="user-dropdown"
            align="end"
          >
            <NavDropdown.Item as={Link} to="/userProfile">
              <i className="fas fa-id-card me-2"></i> Hồ sơ
            </NavDropdown.Item>
            <NavDropdown.Item onClick={logoutHandler}>
              <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
            </NavDropdown.Item>
          </NavDropdown>
        ) : (
          <Nav.Link as={Link} to="/login" className="d-flex align-items-center">
            <i className="fas fa-sign-in-alt me-1"></i>
            <span className="fw-bold"> Đăng nhập</span>
          </Nav.Link>
        )}

        {/* Quản trị viên */}
        {userInfo && isAdmin() && (
          <NavDropdown
            title={
              <span className="d-flex align-items-center">
                <i className="fas fa-cog me-1"></i> Quản trị
              </span>
            }
            id="admin-dropdown"
            align="end"
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


      <div className="navbar-spacer"></div>
    </header>
  );
};

export default Header;