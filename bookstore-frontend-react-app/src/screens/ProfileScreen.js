import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Row, Table, Container, Card } from 'react-bootstrap';
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
  const [avatarPreview, setAvatarPreview] = useState(null);

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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return user?.userName?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="profile-screen">
      <Container className="profile-container">
        {/* Page Header */}
        <div className="profile-page-header">
          <h1 className="page-title">
            <i className="fas fa-user-circle"></i>
            Hồ sơ của tôi
          </h1>
          <p className="page-subtitle">Quản lý thông tin cá nhân và theo dõi đơn hàng</p>
        </div>

        <Row>
          {/* Left Sidebar - User Info & Stats */}
          <Col lg={4}>
            {/* User Profile Card */}
            <Card className="profile-info-card">
              <Card.Body>
                <div className="avatar-section">
                  <div className="avatar-upload-wrapper">
                    <div className="avatar-container">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials()}
                        </div>
                      )}
                      <label htmlFor="avatar-upload" className="avatar-upload-btn">
                        <i className="fas fa-camera"></i>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                  
                  <div className="user-info-section">
                    <h3 className="user-name">{`${firstName} ${lastName}` || user?.userName}</h3>
                    <p className="user-email">
                      <i className="fas fa-envelope"></i>
                      {email}
                    </p>
                    <span className="user-badge">
                      <i className="fas fa-shield-alt"></i>
                      Thành viên
                    </span>
                  </div>
                </div>

                {/* User Statistics */}
                <div className="user-stats">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="stat-content">
                      <h4>{orders?.length || 0}</h4>
                      <p>Đơn hàng</p>
                    </div>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <div className="stat-icon completed">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                      <h4>{orders?.filter(o => o.delivered).length || 0}</h4>
                      <p>Hoàn thành</p>
                    </div>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <div className="stat-icon pending">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-content">
                      <h4>{orders?.filter(o => !o.delivered).length || 0}</h4>
                      <p>Đang xử lý</p>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions Card */}
            <Card className="quick-actions-card">
              <Card.Body>
                <h4 className="section-title">
                  <i className="fas fa-bolt"></i>
                  Thao tác nhanh
                </h4>
                <div className="quick-actions-list">
                  <LinkContainer to="/">
                    <Button className="quick-action-btn">
                      <i className="fas fa-shopping-cart"></i>
                      Tiếp tục mua sắm
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/cart">
                    <Button className="quick-action-btn">
                      <i className="fas fa-shopping-basket"></i>
                      Xem giỏ hàng
                    </Button>
                  </LinkContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Content - Update Form & Orders */}
          <Col lg={8}>
            {/* Update Profile Card */}
            <Card className="profile-update-card">

              <Card.Header className="card-header-custom">
                <h4>
                  <i className="fas fa-user-edit"></i>
                  Cập nhật thông tin cá nhân
                </h4>
              </Card.Header>
              <Card.Body>
                {message && <Message variant='danger'>{message}</Message>}
                {success && <Message variant='success'>Cập nhật hồ sơ thành công!</Message>}
                {(errorUserDetails || errorUpdateUserDetails) && (
                  <Message variant='danger'>{errorUserDetails || errorUpdateUserDetails}</Message>
                )}
                
                <Form onSubmit={userProfileUpdateHandler} className="modern-form">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="form-group">
                        <Form.Label>
                          <i className="fas fa-user"></i>
                          Họ
                        </Form.Label>
                        <Form.Control
                          type='text'
                          placeholder='Nhập họ'
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="form-group">
                        <Form.Label>
                          <i className="fas fa-user"></i>
                          Tên
                        </Form.Label>
                        <Form.Control
                          type='text'
                          placeholder='Nhập tên'
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="form-group">
                    <Form.Label>
                      <i className="fas fa-envelope"></i>
                      Email
                    </Form.Label>
                    <Form.Control 
                      type='email' 
                      placeholder='Nhập email' 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="form-group">
                    <Form.Label>
                      <i className="fas fa-lock"></i>
                      Mật khẩu mới
                    </Form.Label>
                    <Form.Control
                      type='password'
                      placeholder='Nhập mật khẩu mới (để trống nếu không đổi)'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="form-group">
                    <Form.Label>
                      <i className="fas fa-lock"></i>
                      Xác nhận mật khẩu
                    </Form.Label>
                    <Form.Control
                      type='password'
                      placeholder='Xác nhận mật khẩu mới'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Form.Group>

                  <Button type='submit' className="profile-update-btn">
                    <i className="fas fa-save"></i>
                    Cập nhật hồ sơ
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {/* Orders History Card */}
            <Card className="orders-history-card">
              <Card.Header className="card-header-custom">
                <div className="header-content">
                  <h4>
                    <i className="fas fa-history"></i>
                    Lịch sử đơn hàng
                  </h4>
                  <span className="order-count-badge">
                    <i className="fas fa-shopping-bag"></i>
                    {orders?.length || 0} đơn hàng
                  </span>
                </div>
              </Card.Header>
              
              <Card.Body>
                {errorOrderListMy ? (
                  <Message variant='danger'>{errorOrderListMy}</Message>
                ) : orders && orders.length > 0 ? (
                  <div className="orders-table-wrapper">
                    <Table responsive hover className="modern-orders-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
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
                              <span className="order-id">#{order.orderId.substring(0, 8)}</span>
                            </td>
                            <td className="order-date">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="order-total">${order.totalPrice}</td>
                            <td>
                              {order.paid ? (
                                <span className="status-badge success">
                                  <i className="fas fa-check-circle"></i>
                                  Đã thanh toán
                                </span>
                              ) : (
                                <span className="status-badge pending">
                                  <i className="fas fa-clock"></i>
                                  Chờ thanh toán
                                </span>
                              )}
                            </td>
                            <td>
                              {order.delivered ? (
                                <span className="status-badge success">
                                  <i className="fas fa-check-circle"></i>
                                  Đã giao
                                </span>
                              ) : (
                                <span className="status-badge shipping">
                                  <i className="fas fa-truck"></i>
                                  Đang giao
                                </span>
                              )}
                            </td>
                            <td>
                              <LinkContainer to={`/order/${order.orderId}`}>
                                <Button className='view-order-btn'>
                                  <i className="fas fa-eye"></i>
                                  Chi tiết
                                </Button>
                              </LinkContainer>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : !loadingOrderListMy && (
                  <div className="empty-orders">
                    <i className="fas fa-box-open"></i>
                    <p>Bạn chưa có đơn hàng nào</p>
                    <LinkContainer to="/">
                      <Button className="shop-now-btn">
                        <i className="fas fa-shopping-cart"></i>
                        Mua sắm ngay
                      </Button>
                    </LinkContainer>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {(loadingUserDetails || loadingUpdateUserDetails || loadingOrderListMy) && <FullPageLoader />}
    </div>
  );
};

export default ProfileScreen;