import React, { useEffect, useState } from 'react';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import { Button, Col, Form, Row, Image, Container, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { createProductAction } from '../actions/productActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { uploadImageApi, getProductCategories } from '../service/RestApiCalls';
import './ProductCreateScreen.css';

const ProductCreateScreen = ({ match, history }) => {
  const productId = match.params.id;
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('');
  const [availableItemCount, setAvailableItemCount] = useState(0);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [productCategories, setProductCategories] = useState([]);
  const [productCategory, setProductCategory] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [validated, setValidated] = useState(false);

  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  useEffect(async () => {
    await getProductCategories().then((res) => {
      setProductCategories(res.page.content);
    });
  }, [dispatch, history, productId, product]);

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
      createProductAction({
        productId,
        productName,
        price,
        imageId: finalImageId,
        description,
        availableItemCount,
        productCategoryId: productCategory,
        author
      })
    );
    history.push('/admin/productlist');
  };

  return (
    <div className="product-create-screen">
      <Container>
        <Link to='/admin/productlist' className='back-button'>
          <i className="fas fa-arrow-left"></i> Quay lại danh sách sản phẩm
        </Link>
        
        <Card className="product-create-card">
          <Card.Body>
            <div className="product-create-header">
              <div className="icon-wrapper">
                <i className="fas fa-book-medical"></i>
              </div>
              <h1>Tạo sản phẩm mới</h1>
            </div>
            
            {loading ? (
              <div className="loader-container">
                <Loader />
              </div>
            ) : error ? (
              <Message variant='danger'>{error}</Message>
            ) : (
              <Form noValidate validated={validated} onSubmit={submitHandler} className="product-create-form">
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
                      ) : image ? (
                        <Image 
                          src={`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${image}`} 
                          alt="Product Image" 
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
                          <i className="fas fa-upload"></i> Tải lên hình ảnh
                        </label>
                        <Form.Control 
                          type="file"
                          id='image-file'
                          accept="image/*"
                          onChange={uploadFileHandler}
                          className="file-input"
                        />
                      </div>
                      {previewImage && !image && (
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
                      <Col md={6}>
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
                      
                      <Col md={6}>
                        <Form.Group controlId='productCategory' className="mb-3">
                          <Form.Label>Danh mục sản phẩm</Form.Label>
                          <div className="input-group">
                            <div className="input-group-prepend">
                              <span className="input-group-text">
                                <i className="fas fa-tags"></i>
                              </span>
                            </div>
                            <Form.Control 
                              as='select' 
                              required
                              value={productCategory} 
                              onChange={(e) => setProductCategory(e.target.value)}
                              className="form-input select-input"
                            >
                              <option value=''>Chọn danh mục</option>
                              {productCategories.length > 0 &&
                                productCategories.map((pc) => (
                                  <option key={pc.productCategoryId} value={pc.productCategoryId}>
                                    {pc.productCategoryName}
                                  </option>
                                ))
                              }
                            </Form.Control>
                            <Form.Control.Feedback type="invalid">
                              Vui lòng chọn danh mục sản phẩm.
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
                      <Button type='submit' className="create-button">
                        <i className="fas fa-save"></i> Tạo sản phẩm
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

export default ProductCreateScreen;