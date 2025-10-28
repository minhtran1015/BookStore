import React, { useEffect, useState } from 'react';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import { Button, Col, Form, Row, Image, Container, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { listProductDetailsAction, updateProductAction } from '../actions/productActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants';
import { uploadImageApi } from '../service/RestApiCalls';
import './ProductEditScreen.css';

const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id;

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('');
  const [availableItemCount, setAvailableItemCount] = useState(0);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [validated, setValidated] = useState(false);

  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const productUpdate = useSelector((state) => state.productUpdate);
  const { loading: loadingUpdate, error: errorUpdate, success: successUpdate } = productUpdate;

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET });
      history.push('/admin/productlist');
    } else {
      if (!product?.productName || product?.productId !== productId) {
        dispatch(listProductDetailsAction(productId));
      } else {
        setProductName(product.productName);
        setPrice(product.price);
        setImage(product.imageId);
        setAuthor(product.author || '');
        setAvailableItemCount(product.availableItemCount);
        setDescription(product.description);
        setPreviewImage(`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${product.imageId}`);
      }
    }
  }, [dispatch, history, productId, product, successUpdate]);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Tạo URL preview cho hình ảnh
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!imageFile) return;
    
    const formData = new FormData();
    formData.append('imageFile', imageFile);
    setUploading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      const { imageId } = await uploadImageApi(config, formData);
      setImage(imageId);
      setUploading(false);
      
      return imageId;
    } catch (error) {
      console.error(error);
      setUploading(false);
      return null;
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    let finalImageId = image;
    
    // Nếu có file hình mới nhưng chưa upload thì upload trước
    if (imageFile && !image) {
      finalImageId = await handleUploadSubmit();
      if (!finalImageId) return; // Nếu upload thất bại thì dừng lại
    }
    
    dispatch(
      updateProductAction({
        productId,
        productName,
        price,
        imageId: finalImageId,
        description,
        availableItemCount,
        author
      })
    );
  };

  return (
    <div className="product-edit-screen">
      <Container>
        <Link to='/admin/productlist' className='back-button'>
          <i className="fas fa-arrow-left"></i> Quay lại danh sách sản phẩm
        </Link>
        
        <Card className="product-edit-card">
          <Card.Body>
            <div className="product-edit-header">
              <div className="icon-wrapper">
                <i className="fas fa-edit"></i>
              </div>
              <h1>Chỉnh sửa sản phẩm</h1>
              {product && product.productName && (
                <div className="product-name-badge">
                  <i className="fas fa-book"></i> {product.productName}
                </div>
              )}
            </div>
            
            {loadingUpdate && <div className="loader-container"><Loader /></div>}
            {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}
            {successUpdate && <Message variant='success'>Cập nhật sản phẩm thành công!</Message>}
            
            {loading ? (
              <div className="loader-container">
                <Loader />
              </div>
            ) : error ? (
              <Message variant='danger'>{error}</Message>
            ) : (
              <Form noValidate validated={validated} onSubmit={submitHandler} className="product-edit-form">
                <Row>
                  <Col lg={4} className="image-upload-section">
                    <div className="image-preview-container">
                      {previewImage ? (
                        <Image 
                          src={previewImage} 
                          alt="Product Preview" 
                          className="preview-image"
                          fluid
                        />
                      ) : (
                        <div className="no-image">
                          <i className="fas fa-image"></i>
                          <p>Chưa có hình ảnh</p>
                        </div>
                      )}
                      {uploading && (
                        <div className="uploading-overlay">
                          <Loader />
                        </div>
                      )}
                    </div>
                    <div className="file-upload-container">
                      <div className="custom-file-upload">
                        <label htmlFor="image-file" className="upload-btn">
                          <i className="fas fa-upload"></i> Thay đổi hình ảnh
                        </label>
                        <Form.Control 
                          type="file"
                          id='image-file'
                          accept="image/*"
                          onChange={uploadFileHandler}
                          className="file-input"
                        />
                      </div>
                      {previewImage && imageFile && (
                        <Button 
                          variant="outline-primary" 
                          onClick={handleUploadSubmit}
                          disabled={uploading}
                          className="confirm-upload-btn"
                        >
                          <i className="fas fa-cloud-upload-alt"></i> Xác nhận tải lên
                        </Button>
                      )}
                    </div>
                  </Col>
                  
                  <Col lg={8} className="product-details-section">
                    <Row>
                      <Col md={12}>
                        <Form.Group controlId='name' className="mb-3">
                          <Form.Label>Tên sản phẩm</Form.Label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text">
                                <i className="fas fa-book"></i>
                              </span>
                            </div>
                            <Form.Control
                              required
                              type='text'
                              placeholder='Nhập tên sản phẩm'
                              value={productName}
                              onChange={(e) => setProductName(e.target.value)}
                              className="form-input"
                            />
                            <Form.Control.Feedback type="invalid">
                              Vui lòng nhập tên sản phẩm.
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group controlId='author' className="mb-3">
                          <Form.Label>Tác giả</Form.Label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text">
                                <i className="fas fa-pen-fancy"></i>
                              </span>
                            </div>
                            <Form.Control
                              type='text'
                              placeholder='Nhập tên tác giả'
                              value={author}
                              onChange={(e) => setAuthor(e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group controlId='price' className="mb-3">
                          <Form.Label>Giá</Form.Label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text">
                                <i className="fas fa-dollar-sign"></i>
                              </span>
                            </div>
                            <Form.Control
                              required
                              type='number'
                              min="0.01"
                              step="0.01"
                              placeholder='Nhập giá'
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              className="form-input"
                            />
                            <Form.Control.Feedback type="invalid">
                              Vui lòng nhập giá hợp lệ.
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                      
                      <Col md={3}>
                        <Form.Group controlId='countInStock' className="mb-3">
                          <Form.Label>Số lượng</Form.Label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text">
                                <i className="fas fa-cubes"></i>
                              </span>
                            </div>
                            <Form.Control
                              required
                              type='number'
                              min="0"
                              step="1"
                              placeholder='Nhập số lượng'
                              value={availableItemCount}
                              onChange={(e) => setAvailableItemCount(e.target.value)}
                              className="form-input"
                            />
                            <Form.Control.Feedback type="invalid">
                              Vui lòng nhập số lượng hợp lệ.
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group controlId='description' className="mb-4">
                      <Form.Label>Mô tả sản phẩm</Form.Label>
                      <div className="input-group description-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <i className="fas fa-align-left"></i>
                          </span>
                        </div>
                        <Form.Control
                          required
                          as="textarea"
                          rows={5}
                          placeholder='Nhập mô tả sản phẩm'
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="form-input textarea-input"
                        />
                        <Form.Control.Feedback type="invalid">
                          Vui lòng nhập mô tả sản phẩm.
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>

                    <div className="form-actions">
                      <Button type='submit' className="update-button">
                        <i className="fas fa-save"></i> Lưu thay đổi
                      </Button>
                      <Link to='/admin/productlist' className="cancel-button">
                        <i className="fas fa-times"></i> Hủy bỏ
                      </Link>
                    </div>
                  </Col>
                </Row>
              </Form>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ProductEditScreen;