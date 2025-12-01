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
        
        {/* Simple badge for bestseller only */}
        {isBestSeller && (
          <div className="product-badge">
            <i className="fas fa-star"></i>
          </div>
        )}
      </div>
      
      <div className="product-body">
        <h3 className="product-title">
          <Link to={`/product/${product.productId}`}>
            {product.productName}
          </Link>
        </h3>
        
        <div className="product-rating">
          <Rating value={product.averageRating} />
          <span className="rating-count">({product.noOfRatings})</span>
        </div>
        
        <div className="product-price">
          <span className="price">${product.price}</span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="old-price">${product.oldPrice}</span>
          )}
        </div>
        
        <div className="product-footer">
          <div className="product-stock">
            {product.availableItemCount > 0 ? (
              <span className="in-stock">Còn hàng</span>
            ) : (
              <span className="out-of-stock">Hết hàng</span>
            )}
          </div>
          <Link to={`/product/${product.productId}`} className="view-detail-icon">
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default Product;