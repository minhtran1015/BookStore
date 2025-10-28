import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import { register } from '../actions/userActions';
import FullPageLoader from '../components/FullPageLoader';
import { USER_REGISTER_RESET } from '../constants/userConstants';
import './RegisterScreen.css';

const RegisterScreen = (props) => {
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(''); // Thêm lastName
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setconfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [validated, setValidated] = useState(false);

  const dispatch = useDispatch();
  const userRegister = useSelector((state) => state.userRegister);
  let { loading, error, userInfo } = userRegister;

  const redirect = props.location.search ? props.location.search.substring(props.location.search.indexOf('=') + 1) : '/';

  useEffect(() => {
    if (userInfo) {
      props.history.push(redirect);
    }
  }, [props.history, userInfo, redirect]);

  const registerHandler = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setMessage(null);
    //Register
    if (password !== confirmPassword) {
      setMessage('Mật khẩu không khớp');
      dispatch({ type: USER_REGISTER_RESET });
    } else {
      dispatch(register(userName, firstName, email, password));
    }
  };

  return (
    <div className="register-page">
      <Container>
        <Row className="justify-content-md-center">
          <Col md={8} lg={6}>
            <Card className="register-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <i className="fas fa-user-plus register-icon"></i>
                  <h2 className="register-title">Đăng ký tài khoản</h2>
                  <p className="register-subtitle">Tham gia cùng BookStore để khám phá thế giới sách</p>
                </div>
                
                {message && <Message variant='danger'>{message}</Message>}
                {error && <Message variant='danger'>{error instanceof Object ? JSON.stringify(error) : error}</Message>}
                
                <Form noValidate validated={validated} onSubmit={registerHandler}>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId='userName' className="mb-3">
                        <Form.Label>Tên đăng nhập</Form.Label>
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <i className="fas fa-user"></i>
                            </span>
                          </div>
                          <Form.Control
                            required
                            placeholder='Nhập tên đăng nhập'
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="register-input"
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập tên đăng nhập.
                          </Form.Control.Feedback>
                        </div>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group controlId='email' className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <i className="fas fa-envelope"></i>
                            </span>
                          </div>
                          <Form.Control
                            required
                            type='email'
                            placeholder='Nhập địa chỉ email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="register-input"
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập email hợp lệ.
                          </Form.Control.Feedback>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group controlId='firstName' className="mb-3">
                        <Form.Label>Họ và tên đệm</Form.Label>
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <i className="fas fa-user-tag"></i>
                            </span>
                          </div>
                          <Form.Control
                            required
                            placeholder='Nhập họ và tên đệm'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="register-input"
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập họ và tên đệm.
                          </Form.Control.Feedback>
                        </div>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group controlId='lastName' className="mb-3">
                        <Form.Label>Tên</Form.Label>
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <i className="fas fa-signature"></i>
                            </span>
                          </div>
                          <Form.Control
                            placeholder='Nhập tên'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="register-input"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group controlId='password' className="mb-3">
                    <Form.Label>Mật khẩu</Form.Label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">
                          <i className="fas fa-lock"></i>
                        </span>
                      </div>
                      <Form.Control
                        required
                        placeholder='Nhập mật khẩu'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="register-input"
                        minLength="6"
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng nhập mật khẩu (tối thiểu 6 ký tự).
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <Form.Group controlId='confirmPassword' className="mb-4">
                    <Form.Label>Xác nhận mật khẩu</Form.Label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">
                          <i className="fas fa-shield-alt"></i>
                        </span>
                      </div>
                      <Form.Control
                        required
                        placeholder='Xác nhận mật khẩu'
                        type='password'
                        value={confirmPassword}
                        onChange={(e) => setconfirmPassword(e.target.value)}
                        className="register-input"
                        minLength="6"
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng xác nhận mật khẩu.
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <div className="policy-agreement mb-4">
                    <Form.Check 
                      type="checkbox" 
                      required
                      id="terms-checkbox" 
                      label={
                        <span>Tôi đồng ý với <a href="#" className="terms-link">Điều khoản sử dụng</a> và <a href="#" className="terms-link">Chính sách bảo mật</a></span>
                      }
                    />
                  </div>

                  <Button 
                    type='submit' 
                    variant='primary' 
                    className="register-button w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>Đăng ký</>
                    )}
                  </Button>
                </Form>
                
                <div className="login-divider">
                  <span>hoặc</span>
                </div>
                
                <div className="social-login">
                  <Button variant="outline-primary" className="social-btn facebook-btn">
                    <i className="fab fa-facebook-f"></i> Facebook
                  </Button>
                  <Button variant="outline-danger" className="social-btn google-btn">
                    <i className="fab fa-google"></i> Google
                  </Button>
                </div>
                
                <div className="text-center mt-4">
                  <p className="login-text">
                    Đã có tài khoản? {' '}
                    <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="login-link">
                      Đăng nhập ngay
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      {loading && <FullPageLoader />}
    </div>
  );
};

export default RegisterScreen;