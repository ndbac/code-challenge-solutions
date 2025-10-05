import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import {
    validateCreateProduct,
    validateUpdateProduct,
    validateProductQuery,
    validateIdParam
} from '../middleware/validation';

const router = Router();

router.get('/', validateProductQuery, ProductController.getProducts);

router.post('/', validateCreateProduct, ProductController.createProduct);

router.get('/:id', validateIdParam, ProductController.getProductById);

router.put('/:id', validateIdParam, validateUpdateProduct, ProductController.updateProduct);

router.delete('/:id', validateIdParam, ProductController.deleteProduct);

export default router;
