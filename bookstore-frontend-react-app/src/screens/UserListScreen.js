import React, { useEffect, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Container, Row, Col, Card, Form, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { isAdmin } from '../service/CommonUtils';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listUsersAction, deleteUserAction } from '../actions/userActions';
import './UserListScreen.css'; 

const UserListScreen = ({ history }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const userList = useSelector((state) => state.userList);
  const { loading, error, users } = userList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userDelete = useSelector((state) => state.userDelete);
  const { success: successDelete, error: userDeleteError } = userDelete;

  useEffect(() => {
    if (userInfo && isAdmin()) {
      dispatch(listUsersAction());
    } else {
      history.push('/login');
    }
  }, [dispatch, history, successDelete, userInfo]);

  const deleteHandler = (userId, userName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}" không?`)) {
      dispatch(deleteUserAction(userId));
    }
  };

  // Lọc người dùng theo từ khóa tìm kiếm
  const filteredUsers = users ? users.filter(user => 
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Container className="user-list-screen">
      <Card className="user-list-card">
        <Card.Body>
          <Row className="align-items-center mb-4">
            <Col>
              <h1 className="user-list-title">
                <i className="fas fa-users admin-icon"></i> Quản lý người dùng
              </h1>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="search-icon">
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <Button 
                    variant="light" 
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>

          {userDeleteError && <Message variant='danger'>{userDeleteError}</Message>}
          {successDelete && <Message variant='success'>Xóa người dùng thành công</Message>}
          
          {loading ? (
            <Loader />
          ) : error ? (
            <Message variant='danger'>{error}</Message>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-users">
              {searchTerm ? (
                <>
                  <i className="fas fa-search"></i>
                  <p>Không tìm thấy người dùng nào phù hợp với "{searchTerm}"</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setSearchTerm('')}
                    className="clear-filter-btn"
                  >
                    <i className="fas fa-list"></i> Xem tất cả người dùng
                  </Button>
                </>
              ) : (
                <>
                  <i className="fas fa-users-slash"></i>
                  <p>Chưa có người dùng nào trong hệ thống</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive user-table-container">
                <Table hover className='user-table'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên đăng nhập</th>
                      <th>Họ và tên đệm</th>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.userId}>
                        <td className="user-id">{user.userId}</td>
                        <td className="user-name">{user.userName}</td>
                        <td>{user.firstName}</td>
                        <td>{user.lastName}</td>
                        <td>
                          <a href={`mailto:${user.email}`} className="user-email">
                            <i className="fas fa-envelope"></i> {user.email}
                          </a>
                        </td>
                        <td>
                          <div className="user-roles">
                            {user.roles.map((role, index) => {
                              if (role.roleName === 'ADMIN_USER') {
                                return (
                                  <span key={index} className="role admin-role">
                                    <i className="fas fa-user-shield"></i> {role.roleName}
                                  </span>
                                );
                              }
                              return (
                                <span key={index} className="role user-role">
                                  <i className="fas fa-user"></i> {role.roleName}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div className="table-actions">
                            <LinkContainer to={`/admin/user/${user.userId}/edit`}>
                              <Button variant='light' className='btn-action edit-btn'>
                                <i className='fas fa-edit'></i>
                              </Button>
                            </LinkContainer>
                            <Button 
                              variant='danger' 
                              className='btn-action delete-btn'
                              onClick={() => deleteHandler(user.userId, user.userName)}
                            >
                              <i className='fas fa-trash'></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <div className="user-count-info">
                Hiển thị {filteredUsers.length} / {users.length} người dùng
                {searchTerm && (
                  <Button 
                    variant="link" 
                    className="clear-search-link"
                    onClick={() => setSearchTerm('')}
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserListScreen;