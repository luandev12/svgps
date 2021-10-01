const { gql } = require('graphql-request');

exports.createOrder = gql`
  mutation insert_order_one($object: order_insert_input!) {
    insert_order_one(
      object: $object
      on_conflict: {
        update_columns: [productId, price, url, title, price, cutomer, canvas, checkout, previewUrl]
        constraint: cart_pkey
      }
    ) {
      id
    }
  }
`;

exports.getTemplate = gql`
  query template($id: uuid!) {
    template_preview_2(where: { template_id: { _eq: $id } }) {
      id
      width
      height
      bg_color
      bg_image_url
      canvas
      widthBg
      heightBg
    }
    template_eps_2(where: { template_id: { _eq: $id } }) {
      id
      width
      height
      bg_image_url
      canvas
      widthBg
      heightBg
    }
  }
`;

exports.getCart = gql`
  query cart($mapId: String_comparison_exp) {
    cart(where: { mapId: $mapId }) {
      id
      eps
    }
  }
`;

exports.getImageLibrary = gql`
  query library_image_2($library_id: Int_comparison_exp, $position: Int_comparison_exp) {
    library_image_2(where: { library_id: $library_id, position: $position }) {
      id
      url
    }
  }
`;
