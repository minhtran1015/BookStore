import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { getUserDetails, updateUserAction } from '../actions/userActions';
import { USER_UPDATE_RESET } from '../constants/userConstants';
import { getAllRolesApi } from '../service/RestApiCalls';
import './UserEditScreen.css';

const UserEditScreen = ({ match, history }) => {
  const userId = match.params.id;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState([]);

  const dispatch = useDispatch();
  const userDetails = useSelector((state) => state.userDetails);
  const { loading, error, user } = userDetails;

  const userUpdate = useSelector((state) => state.userUpdate);
  const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = userUpdate;

  const [checkedItems, setCheckedItems] = useState(new Map());

  useEffect(async () => {
    if (successUpdate) {
      dispatch({ type: USER_UPDATE_RESET });
      history.push('/admin/userlist');
    } else {
      if (!user.userName || user.userId !== userId) {
        dispatch(getUserDetails(userId));
      } else {
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
        user.roles.forEach((role) => {
          checkedItems.set(role.roleName, true);
          setCheckedItems(new Map(checkedItems));
        });
      }
    }
    await getAllRolesApi().then((roles) => {
      setRoles(roles);
    });
  }, [dispatch, history, userId, user, successUpdate]);

  const handleChange = (event) => {
    checkedItems.set(event.target.name, event.target.checked);
    setCheckedItems(new Map(checkedItems));
  };

  const submitHandler = (e) => {
    e.preventDefault();

    let roles = Array.from(checkedItems)
      .filter((item) => item[1] === true)
      .map((i) => {
        return i[0];
      });

    dispatch(
      updateUserAction(userId, {
        firstName,
        lastName,
        email,
        roles
      })
    );
  };

  return (
    <div className="user-edit-screen">
      <Container>
        <Link to='/admin/userlist' className='back-button'>
          <i className="fas fa-arrow-left"></i> Quay lại danh sách người dùng
        </Link>
        
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="user-edit-card">
              <Card.Body>
                <div className="user-edit-header">
                  <div className="icon-wrapper">
                    <i className="fas fa-user-edit"></i>
                  </div>
                  <h1>Chỉnh sửa thông tin người dùng</h1>
                  {user && user.userName && (
                    <div className="username-badge">
                      <i className="fas fa-user"></i> {user.userName}
                    </div>
                  )}
                </div>

                {loadingUpdate && <Loader />}
                {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}
                {successUpdate && <Message variant='success'>Cập nhật thành công!</Message>}

                {loading ? (
                  <div className="loader-container">
                    <Loader />
                  </div>
                ) : error ? (
                  <Message variant='danger'>{error}</Message>
                ) : (
                  <Form onSubmit={submitHandler} className="user-edit-form">
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
                              type='text'
                              placeholder='Nhập họ và tên đệm'
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="form-input"
                            />
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
                              type='text'
                              placeholder='Nhập tên'
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group controlId='email' className="mb-4">
                      <Form.Label>Email</Form.Label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <i className="fas fa-envelope"></i>
                          </span>
                        </div>
                        <Form.Control
                          type='email'
                          placeholder='Nhập địa chỉ email'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </Form.Group>

                    {roles.length > 0 && (
                      <div className="roles-section">
                        <h4 className="roles-title">
                          <i className="fas fa-shield-alt"></i> Phân quyền người dùng
                        </h4>
                        <div className="roles-container">
                          {roles.map((role) => (
                            <div key={role.roleName} className="role-item">
                              <Form.Check
                                custom
                                type="checkbox"
                                id={role.roleName}
                                label={role.roleName}
                                checked={!!checkedItems.get(role.roleName)}
                                name={role.roleName}
                                onChange={handleChange}
                                className={`role-checkbox ${role.roleName === 'ADMIN_USER' ? 'admin-role' : ''}`}
                              />
                              <div className="role-icon">
                                {role.roleName === 'ADMIN_USER' ? (
                                  <i className="fas fa-user-shield"></i>
                                ) : (
                                  <i className="fas fa-user"></i>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="form-actions">
                      <Button type='submit' className="update-button">
                        <i className="fas fa-save"></i> Lưu thay đổi
                      </Button>
                      <Link to='/admin/userlist' className="cancel-button">
                        <i className="fas fa-times"></i> Hủy bỏ
                      </Link>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserEditScreen;