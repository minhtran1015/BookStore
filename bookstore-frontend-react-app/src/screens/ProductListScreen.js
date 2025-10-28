import React, { useEffect, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col, Card, Container, Form, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { isAdmin } from '../service/CommonUtils';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listProductsAction, deleteProductAction } from '../actions/productActions';
import { PRODUCT_CREATE_RESET } from '../constants/productConstants';
import ReactPaginate from 'react-paginate';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import './ProductListScreen.css';

const ProductListScreen = ({ history, match }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const productList = useSelector((state) => state.productList);
  const { loading, error, products, pageResponse } = productList;

  const productDelete = useSelector((state) => state.productDelete);
  const { loading: loadingDelete, error: errorDelete, success: successDelete } = productDelete;

  const productCreate = useSelector((state) => state.productCreate);
  const { loading: loadingCreate, error: errorCreate, success: successCreate, product: createdProduct } = productCreate;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET });

    if (!userInfo || !isAdmin()) {
      history.push('/login');
    }
    dispatch(listProductsAction(0));
  }, [dispatch, history, userInfo, successDelete, successCreate, createdProduct]);

  const deleteHandler = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không?`)) {
      dispatch(deleteProductAction(id));
    }
  };

  const createProductHandler = () => {
    history.push('/admin/product/create');
  };

  const handlePageClick = (data) => {
    let selected = data.selected;
    dispatch(listProductsAction(selected));
  };
  
  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = products ? products.filter(product => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Container className="product-list-screen">
      <Card className="product-list-card">
        <Card.Body>
          <Row className="align-items-center mb-4">
            <Col>
              <h1 className="product-list-title">
                <i className="fas fa-book admin-icon"></i> Quản lý sản phẩm
              </h1>
            </Col>
            <Col md={4}>
              <InputGroup className="search-input-group">
                <InputGroup.Text className="search-icon">
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
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
            <Col md={3} className="text-right">
              <Button className="create-product-btn" onClick={createProductHandler}>
                <i className="fas fa-plus"></i> Thêm sản phẩm mới
              </Button>
            </Col>
          </Row>
          
          {loadingDelete && <Loader />}
          {errorDelete && <Message variant='danger'>{errorDelete}</Message>}
          {successDelete && <Message variant='success'>Xóa sản phẩm thành công</Message>}
          
          {loadingCreate && <Loader />}
          {errorCreate && <Message variant='danger'>{errorCreate}</Message>}
          
          {loading ? (
            <div className="loader-container">
              <Loader />
            </div>
          ) : error ? (
            <Message variant='danger'>{error}</Message>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-products">
              {searchTerm ? (
                <>
                  <div className="empty-icon-container">
                    <i className="fas fa-search"></i>
                  </div>
                  <p>Không tìm thấy sản phẩm nào phù hợp với "<span className="search-term">{searchTerm}</span>"</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setSearchTerm('')}
                    className="clear-filter-btn"
                  >
                    <i className="fas fa-list"></i> Xem tất cả sản phẩm
                  </Button>
                </>
              ) : (
                <>
                  <div className="empty-icon-container">
                    <i className="fas fa-book-open"></i>
                  </div>
                  <p>Chưa có sản phẩm nào trong hệ thống</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive product-table-container">
                <Table hover className='product-table'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Hình ảnh</th>
                      <th>Tên sản phẩm</th>
                      <th>Giá</th>
                      <th>Danh mục</th>
                      <th>Số lượng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.productId}>
                        <td className="product-id">{product.productId}</td>
                        <td className="product-image-cell">
                          {product.imageId && (
                            <img 
                              src={`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${product.imageId}`} 
                              alt={product.productName} 
                              className="product-thumbnail"
                            />
                          )}
                        </td>
                        <td className="product-name">{product.productName}</td>
                        <td className="product-price">${product.price}</td>
                        <td>
                          <span className="product-category-badge">
                            {product.productCategory}
                          </span>
                        </td>
                        <td>
                          {product.availableItemCount > 0 ? (
                            <span className="product-count in-stock">
                              <i className="fas fa-check-circle"></i> {product.availableItemCount}
                            </span>
                          ) : (
                            <span className="product-count out-of-stock">
                              <i className="fas fa-times-circle"></i> Hết hàng
                            </span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <div className="table-actions">
                            <LinkContainer to={`/admin/product/${product.productId}/edit`}>
                              <Button variant='light' className='btn-action edit-btn'>
                                <i className='fas fa-edit'></i>
                              </Button>
                            </LinkContainer>
                            <Button 
                              variant='danger' 
                              className='btn-action delete-btn'
                              onClick={() => deleteHandler(product.productId, product.productName)}
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
              
              <div className="pagination-container">
                <div className="product-count-info">
                  <i className="fas fa-book-open"></i> Hiển thị 
                  <span className="highlight">{filteredProducts.length}</span> / 
                  <span className="highlight">{products.length}</span> sản phẩm
                  {searchTerm && (
                    <Button 
                      variant="link" 
                      className="clear-search-link"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="fas fa-times-circle"></i> Xóa tìm kiếm
                    </Button>
                  )}
                </div>
                
                {pageResponse && pageResponse.totalPages > 1 && (
                  <ReactPaginate
                    previousLabel={<i className="fas fa-chevron-left"></i>}
                    nextLabel={<i className="fas fa-chevron-right"></i>}
                    breakLabel={"..."}
                    breakClassName={"break-me"}
                    pageCount={pageResponse?.totalPages || 1}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={handlePageClick}
                    containerClassName={"custom-pagination"}
                    pageClassName={"page-item"}
                    activeClassName={"active"}
                    pageLinkClassName={"page-link"}
                    previousClassName={"page-item"}
                    nextClassName={"page-item"}
                    previousLinkClassName={"page-link nav-button"}
                    nextLinkClassName={"page-link nav-button"}
                    disabledClassName={"disabled"}
                  />
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductListScreen;