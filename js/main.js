$(function() {
  var root = {
    children: []
  },
  parent = root;

  $('section').each(function() {
    var section = $(this);

    var heading = $('h2, h3', section);

    var navItem = {
      id: section.attr('id'),
      text: heading.text(),
      children: [],
    };

    if ('H3' === heading.prop('tagName')) {
      parent.children.push(navItem);
    } else {
      root.children.push(navItem);
      parent = navItem;
    }
  });

  _buildNav = function(nodeList) {
    if (!nodeList.length) {
      return '';
    }

    var html = '<ul>';

    nodeList.forEach(function(node) {
      html += '<li>';
      html += '<a href="#' + node.id + '">' + node.text + '</a>';

      html += _buildNav(node.children);

      html += '</li>';
    });

    return html + '</ul>';
  };

  $('nav').append(_buildNav(root.children));
});