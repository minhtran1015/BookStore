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
          className='navbar navbar-expand-lg bookstore-navbar'
          collapseOnSelect
          fixed="top"
        >
        <Container>
          <Link to='/' className="d-flex align-items-center text-decoration-none">
            <Navbar.Brand className='bookstore-brand'>
              {/* <Image 
                src="/favicon.ico" 
                alt="BookStore" 
                className="navbar-logo mr-2" 
              />  */}
              BookStore
            </Navbar.Brand>
            
          </Link>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='navbar-nav ml-auto'>
              <Link to='/cart' className='nav-link'>
                <i 
                  className='fas fa-shopping-cart nav-icon'
                  data-count={userLogin.cartItems?.length || 0}
                ></i> 
                <span className="nav-text">Giỏ hàng</span>
              </Link>
              {userInfo ? (
                <NavDropdown 
                  title={
                    <div className="d-inline-flex align-items-center">
                      <i className="fas fa-user-circle nav-icon"></i>
                      <span className="nav-text">{userInfo.userName}</span>
                    </div>
                  } 
                  id='username'
                  className="user-dropdown"
                >
                  <Link to='/userProfile' className='dropdown-item'>
                    <i className="fas fa-id-card dropdown-icon"></i> Hồ sơ
                  </Link>
                  <NavDropdown.Item onClick={logoutHandler}>
                    <i className="fas fa-sign-out-alt dropdown-icon"></i> Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Link to='/login' className='nav-link'>
                  <i className='fas fa-sign-in-alt nav-icon'></i> 
                  <span className="nav-text">Đăng nhập</span>
                </Link>
              )}
              {userInfo && isAdmin() && (
                <NavDropdown 
                  title={
                    <div className="d-inline-flex align-items-center">
                      <i className="fas fa-cog nav-icon"></i>
                      <span className="nav-text">Quản trị</span>
                    </div>
                  } 
                  id='adminmenu'
                  className="admin-dropdown"
                >
                  <Link to='/admin/userlist' className='dropdown-item'>
                    <i className="fas fa-users dropdown-icon"></i> Người dùng
                  </Link>
                  <Link to='/admin/productlist' className='dropdown-item'>
                    <i className="fas fa-book dropdown-icon"></i> Sản phẩm
                  </Link>
                  <Link to='/admin/orderlist' className='dropdown-item'>
                    <i className="fas fa-clipboard-list dropdown-icon"></i> Đơn hàng
                  </Link>
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