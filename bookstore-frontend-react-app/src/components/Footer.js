import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <Container>
        <Row className="footer-main">
          <Col md={4} sm={12} className="footer-about mb-4 mb-md-0">
            <h5 className="footer-title">DLK BookStore</h5>
            <p className="footer-desc">
              Chúng tôi cung cấp hàng ngàn đầu sách chất lượng với dịch vụ giao hàng 
              nhanh chóng và trải nghiệm mua sắm tuyệt vời.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </Col>
          
          <Col md={2} sm={6} className="footer-links mb-4 mb-md-0">
            <h5 className="footer-title">Liên kết</h5>
            <ul className="footer-menu">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/cart">Giỏ hàng</Link></li>
              <li><Link to="/login">Đăng nhập</Link></li>
              <li><Link to="/register">Đăng ký</Link></li>
            </ul>
          </Col>
          
          <Col md={3} sm={6} className="footer-links mb-4 mb-md-0">
            <h5 className="footer-title">Danh mục sách</h5>
            <ul className="footer-menu">
              <li><Link to="/?category=fiction">Tiểu thuyết</Link></li>
              <li><Link to="/?category=science">Khoa học</Link></li>
              <li><Link to="/?category=business">Kinh doanh</Link></li>
              <li><Link to="/?category=biography">Tiểu sử</Link></li>
            </ul>
          </Col>
          
          <Col md={3} className="footer-contact">
            <h5 className="footer-title">Liên hệ</h5>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>144 Xuân Thủy, Cầu Giấy, Hà Nội</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-phone-alt"></i>
              <span>+84 28 3864 7256</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <span>support@dlkbookstore.com</span>
            </div>
          </Col>
        </Row>
        
        <Row className="footer-bottom">
          <Col className="text-center">
            <p className="copyright">
              &copy; {currentYear} DLK BookStore. Đã đăng ký bản quyền.
            </p>
            <div className="payment-methods">
              <i className="fab fa-cc-visa"></i>
              <i className="fab fa-cc-mastercard"></i>
              <i className="fab fa-cc-paypal"></i>
              <i className="fab fa-cc-apple-pay"></i>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;