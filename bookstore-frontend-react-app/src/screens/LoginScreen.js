import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import { login } from '../actions/userActions';
import FormContainer from '../components/FormContainer';
import FullPageLoader from '../components/FullPageLoader';
import './LoginScreen.css';

const LoginScreen = (props) => {
  const [userNameOrEmail, setUserNameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const redirect = props.location.search ? props.location.search.substring(props.location.search.indexOf('=') + 1) : '/';

  useEffect(() => {
    if (userInfo) {
      props.history.push(redirect);
    }
  }, [props.history, userInfo, redirect]);

  const loginSubmitHandler = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    dispatch(login(userNameOrEmail, password));
  };

  return (
    <div className="login-page">
      <Container>
        <Row className="justify-content-md-center">
          <Col md={6} lg={5}>
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <i className="fas fa-user-circle login-icon"></i>
                  <h2 className="login-title">Đăng nhập</h2>
                  <p className="login-subtitle">Chào mừng bạn trở lại với BookStore</p>
                </div>
                
                {error && <Message variant='danger'>{error instanceof Object ? JSON.stringify(error) : error}</Message>}
                
                <Form noValidate validated={validated} onSubmit={loginSubmitHandler}>
                  <Form.Group controlId='userNameOrEmail' className="mb-3">
                    <Form.Label>Tên đăng nhập hoặc Email</Form.Label>
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">
                          <i className="fas fa-user"></i>
                        </span>
                      </div>
                      <Form.Control
                        required
                        placeholder='Nhập tên đăng nhập hoặc email'
                        value={userNameOrEmail}
                        onChange={(e) => setUserNameOrEmail(e.target.value)}
                        className="login-input"
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng nhập tên đăng nhập hoặc email.
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <Form.Group controlId='password' className="mb-4">
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
                        className="login-input"
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng nhập mật khẩu.
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <Button 
                    type='submit' 
                    variant='primary' 
                    className="login-button w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                        Đang đăng nhập...
                      </>
                    ) : (
                      <>Đăng nhập</>
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
                  <p className="register-text">
                    Chưa có tài khoản? {' '}
                    <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className="register-link">
                      Đăng ký ngay
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

export default LoginScreen;