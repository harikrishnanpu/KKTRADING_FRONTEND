// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {  ShoppingCart, Receipt, RotateLeft, Danger, Home, SecurityUser} from 'iconsax-react';

// type

// icons
// icons
const icons = {
  invoice:  ShoppingCart,
  purchase: Receipt,
  return: RotateLeft,
  damage: Danger,
  sub: SecurityUser
};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const apps = {
  id: 'App',
  title: <FormattedMessage id="Apps" />,
  type: 'group',
  children: [,
    {
      id: 'return',
      title: <FormattedMessage id="Return" />,
      type: 'collapse',
      // url: '/return/dashboard',
      icon: icons.return,
      children: [
        {
          id: 'Create',
          title: <FormattedMessage id="Create Return" />,
          type: 'item',
          url: '/return/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'List',
          title: <FormattedMessage id="All Returns" />,
          type: 'item',
          url: '/return/list/',
          target: false,
          breadcrumbs: true
        }
      ]
    },
    {
      id: 'damage',
      title: <FormattedMessage id="Damage" />,
      type: 'collapse',
      // url: '/damage/dashboard',
      icon: icons.damage,
      children: [
        {
          id: 'Create',
          title: <FormattedMessage id="Create Damage" />,
          type: 'item',
          url: '/damage/create/',
          target: false,
          breadcrumbs: false
        },
        {
          id: 'List',
          title: <FormattedMessage id="All Damages" />,
          type: 'item',
          url: '/damage/list/',
          target: false,
          breadcrumbs: true
        }
      ]
    }
  ]
};

export default apps;


