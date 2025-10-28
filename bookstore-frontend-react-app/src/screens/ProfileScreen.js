import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Row, Table, Container } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import { listMyOrdersAction } from '../actions/orderActions';
import { getUserDetails, updateUserProfile } from '../actions/userActions';
import FullPageLoader from '../components/FullPageLoader';
import Message from '../components/Message';
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants';
import './ProfileScreen.css';

const ProfileScreen = ({ history }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userDetails = useSelector((state) => state.userDetails);
  const { error: errorUserDetails, loading: loadingUserDetails, user } = userDetails;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { error: errorUpdateUserDetails, loading: loadingUpdateUserDetails, success } = userUpdateProfile;

  const orderListMy = useSelector((state) => state.orderListMy);
  const { error: errorOrderListMy, loading: loadingOrderListMy, orders } = orderListMy;

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    } else {
      if (!user || !user.userName) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET });
        dispatch(getUserDetails());
      } else {
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
      }
    }
    dispatch(listMyOrdersAction());
  }, [dispatch, history, userInfo, user]);

  const userProfileUpdateHandler = (e) => {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage('Mật khẩu không khớp');
    } else {
      dispatch(updateUserProfile({ firstName, lastName, email, password }));
    }
  };

  return (
    <Container className="profile-screen">
      <Row>
        <Col md={3}>
          <div className="profile-header">
            <h2><i className="fas fa-user-circle"></i> Hồ sơ cá nhân</h2>
          </div>
          
          <div className="profile-form">
            {message && <Message variant='danger'>{message}</Message>}
            {success && <Message variant='success'>Cập nhật hồ sơ thành công</Message>}
            {(errorUserDetails || errorUpdateUserDetails) && (
              <Message variant='danger'>{errorUserDetails || errorUpdateUserDetails}</Message>
            )}
            
            <Form onSubmit={userProfileUpdateHandler}>
              <Form.Group controlId='firstName'>
                <Form.Label>Họ</Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Nhập họ'
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId='lastName'>
                <Form.Label>Tên</Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Nhập tên'
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId='email'>
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type='email' 
                  placeholder='Nhập email' 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId='password'>
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Nhập mật khẩu mới'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId='confirmPassword'>
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Xác nhận mật khẩu'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Form.Group>

              <Button type='submit' className="profile-update-btn">
                <i className="fas fa-save mr-2"></i> Cập nhật
              </Button>
            </Form>
          </div>
        </Col>
        
        <Col md={9}>
          <div className="profile-orders">
            <div className="profile-orders-header">
              <h2><i className="fas fa-shopping-bag"></i> Đơn hàng của tôi</h2>
            </div>
            
            {errorOrderListMy ? (
              <Message variant='danger'>{errorOrderListMy}</Message>
            ) : orders && orders.length > 0 ? (
              <Table responsive hover className="orders-table">
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Ngày đặt</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Giao hàng</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId}>
                      <td>
                        <span className="order-id">{order.orderId.substring(0, 10)}...</span>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>${order.totalPrice}</td>
                      <td>
                        {order.paid ? (
                          <span className="paid-status success">
                            <i className="fas fa-check-circle"></i> 
                            {new Date(order.paymentDate).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="paid-status pending">
                            <i className="fas fa-clock"></i> Chờ thanh toán
                          </span>
                        )}
                      </td>
                      <td>
                        {order.delivered ? (
                          <span className="delivered-status success">
                            <i className="fas fa-check-circle"></i>
                            {new Date(order.deliveredDate).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="delivered-status pending">
                            <i className="fas fa-truck"></i> Đang giao
                          </span>
                        )}
                      </td>
                      <td>
                        <LinkContainer to={`/order/${order.orderId}`}>
                          <Button className='btn-sm' variant='light'>
                            <i className="fas fa-eye mr-1"></i> Chi tiết
                          </Button>
                        </LinkContainer>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : !loadingOrderListMy && (
              <div className="empty-orders">
                <i className="fas fa-box-open"></i>
                <p>Bạn chưa có đơn hàng nào</p>
                <LinkContainer to="/">
                  <Button variant="outline-primary">Mua sắm ngay</Button>
                </LinkContainer>
              </div>
            )}
          </div>
        </Col>
      </Row>
      {(loadingUserDetails || loadingUpdateUserDetails || loadingOrderListMy) && <FullPageLoader />}
    </Container>
  );
};

export default ProfileScreen;