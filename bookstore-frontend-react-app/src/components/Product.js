import React from 'react';
import { BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import { Card, Button } from 'react-bootstrap';
import Rating from './Rating';
import { Link } from 'react-router-dom';
import './Product.css';

const Product = (props) => {
  const product = props.product;
  
  // Kiểm tra xem sản phẩm có phải là best seller không (ví dụ: dựa vào số lượng đánh giá)
  const isBestSeller = product.noOfRatings >= 10;
  
  return (
    <Card className='product-card'>
      <div className="product-image-container">
        <Link to={`/product/${product.productId}`}>
          <Card.Img
            className="product-image"
            src={`${BACKEND_API_GATEWAY_URL}/api/catalog/image/${product?.imageId}`}
            alt={product.productName}
          />
        </Link>
        
        {/* Overlay khi hover */}
        <div className="product-overlay">
          <Link to={`/product/${product.productId}`} className="view-details-btn">
            <i className="fas fa-search"></i> Xem chi tiết
          </Link>
        </div>
        
        {/* Badges */}
        <div className="product-badges">
          {product.isNew && <div className="product-badge new-badge">Mới</div>}
          {isBestSeller && <div className="product-badge bestseller-badge">Best Seller</div>}
          {product.availableItemCount <= 5 && product.availableItemCount > 0 && 
            <div className="product-badge limited-badge">Sắp hết hàng</div>}
        </div>
      </div>
      
      <div className="product-body">
        {product.productCategory && (
          <div className="product-category">{product.productCategory}</div>
        )}
        
<h3 
  className="product-title" 
  title={product.productName}
  data-truncated={product.productName.length > 50 ? "true" : "false"}
>
  <Link to={`/product/${product.productId}`}>
    {product.productName}
  </Link>
</h3>
        
        {/* Thêm thông tin tác giả nếu có */}
        {product.author && (
          <div className="product-author">
            <i className="fas fa-pen-fancy"></i> {product.author}
          </div>
        )}
        
        <div className="product-rating">
          <Rating 
            value={product.averageRating} 
            text={`${product.noOfRatings} đánh giá`} 
          />
        </div>
        
        <div className="product-price">
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="product-old-price">${product.oldPrice}</span>
          )}
          <span className="product-price-currency">$</span>
          <span className="product-price-value">{product.price}</span>
        </div>
        
        <div className="product-footer">
          <Link to={`/product/${product.productId}`} className="product-details-link">
            <i className="fas fa-book"></i> Chi tiết
          </Link>
          {product.availableItemCount > 0 ? (
            <span className="product-in-stock">
              <i className="fas fa-check-circle"></i> Còn hàng
            </span>
          ) : (
            <span className="product-out-of-stock">
              <i className="fas fa-times-circle"></i> Hết hàng
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Product;