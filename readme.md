#Shopping Cart 

##Description   

This is a basic project for an e-commerce shopping cart.

##Additional features on v7
- Add Git and manage future updates with Git instead of creating new versions.
- Tried to deploy to Heroku but it asks for Credit Card to integrate sendgrid functionality (email validation and password reset). So please test sendgrid functions locally (with localhost) with your Sendgrid key. For testing purposes, go to /admin/register route and register an admin to test adding products. Demo Version without sendgrid functionality at:
 https://fast-springs-80090.herokuapp.com/
to the database (used mongoDB Atlas and Cloudinary). IF YOU WANT A LIVE FUNCTIONALITY DEMO OR AN ADMIN CODE TO SIGN UP AS ADMIN, PLEASE CONTACT ME AT JORGEGARCIAS@GMAIL.COM 
- Removes Images from cloudinary when deleting a product (before this, it only deleted the item from mongoose but the image remained on cloudinary).


##Further Functionality
Next steps would be:
- Integrate the cart with online payment suites.
- Keep in mind when to sanitize (preven script injection) when adding a product.

