/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')
const windowActions = require('../actions/windowActions')
const config = require('../constants/config')
const siteSettings = require('../state/siteSettings')
const cx = require('../lib/classSet.js')

export default class ContextMenuItem extends ImmutableComponent {
  get submenu () {
    return this.props.contextMenuItem.get('submenu')
  }
  get hasSubmenu () {
    return this.submenu && this.submenu.size > 0
  }
  onClick (clickAction, shouldHide, e) {
    e.stopPropagation()
    if (clickAction) {
      if (shouldHide) {
        windowActions.setContextMenuDetail()
      }
      clickAction(e)
    }
  }
  onDragStart (e) {
    if (this.props.contextMenuItem.get('dragStart')) {
      this.props.contextMenuItem.get('dragStart')(e)
    }
  }
  onDragEnd (e) {
    if (this.props.contextMenuItem.get('dragEnd')) {
      this.props.contextMenuItem.get('dragEnd')(e)
    }
  }
  onDragOver (e) {
    if (this.props.contextMenuItem.get('dragOver')) {
      this.props.contextMenuItem.get('dragOver')(e)
    }
    this.onMouseEnter(e)
  }
  onDrop (e) {
    if (this.props.contextMenuItem.get('drop')) {
      this.props.contextMenuItem.get('drop')(e)
    }
    windowActions.setContextMenuDetail()
  }
  onContextMenu (e) {
    if (this.props.contextMenuItem.get('contextMenu')) {
      this.props.contextMenuItem.get('contextMenu')(e)
    }
    windowActions.setContextMenuDetail()
  }
  onMouseEnter (e) {
    let openedSubmenuDetails = this.props.contextMenuDetail.get('openedSubmenuDetails')
    openedSubmenuDetails = openedSubmenuDetails ? openedSubmenuDetails.splice(this.props.submenuIndex, this.props.contextMenuDetail.get('openedSubmenuDetails').size) : new Immutable.List()
    if (this.hasSubmenu) {
      let node = e.target
      while (node && node.classList && !node.classList.contains('contextMenuItem')) {
        node = node.parentNode
      }
      let parentNode = node.parentNode
      while (parentNode && parentNode.classList && !parentNode.classList.contains('contextMenu')) {
        parentNode = parentNode.parentNode
      }
      const parentBoundingRect = parentNode.getBoundingClientRect()
      const boundingRect = node.getBoundingClientRect()
      openedSubmenuDetails = openedSubmenuDetails.push(Immutable.fromJS({
        y: boundingRect.top - parentBoundingRect.top - 1,
        template: this.submenu
      }))
    }
    windowActions.setContextMenuDetail(this.props.contextMenuDetail.set('openedSubmenuDetails', openedSubmenuDetails))
  }
  onMouseLeave (e) {
    if (this.hasSubmenu) {
    }
  }
  getLabelForItem (item) {
    const label = item.get('label')
    if (label) {
      return label
    }
    if (item.get('labelDataBind') === 'zoomLevel') {
      const settings = siteSettings.getSiteSettingsForURL(this.props.siteSettings, item.get('dataBindParam'))
      const zoomLevel = settings && settings.get('zoomLevel') || config.zoom.defaultValue
      return ((100 + zoomLevel * 10) | 0) + '%'
    }
    return ''
  }
  render () {
    if (this.props.contextMenuItem.get('type') === 'separator') {
      return <div className='contextMenuItem contextMenuSeparator' role='listitem'>
        <hr/>
      </div>
    } else if (this.props.contextMenuItem.get('type') === 'multi') {
      return <div className='contextMenuItem multiContextMenuItem'>
        <span className='multiItemTitle' data-l10n-id={this.props.contextMenuItem.get('l10nLabelId')}/>
      {
        this.props.contextMenuItem.get('submenu').map((subItem) =>
          <div className='contextMenuSubItem'
            onClick={this.onClick.bind(this, subItem.get('click'), false)}>
            <span data-l10n-id={subItem.get('l10nLabelId')}>{this.getLabelForItem(subItem)}</span>
          </div>)
      }
      </div>
    }
    return <div className={cx({
      contextMenuItem: true,
      checkedMenuItem: this.props.contextMenuItem.get('checked')
    })}
      role='listitem'
      draggable={this.props.contextMenuItem.get('draggable')}
      onDragStart={this.onDragStart.bind(this)}
      onDragEnd={this.onDragEnd.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onDrop={this.onDrop.bind(this)}
      onContextMenu={this.onContextMenu.bind(this)}
      disabled={this.props.contextMenuItem.get('enabled') === false}
      onMouseEnter={this.onMouseEnter.bind(this)}
      onMouseLeave={this.onMouseLeave.bind(this)}
      onClick={this.onClick.bind(this, this.props.contextMenuItem.get('click'), true)}>
      {
        this.props.contextMenuItem.get('checked')
        ? <span className='fa fa-check contextMenuCheckIndicator'/>
        : null
      }
      <span className='contextMenuItemText'
        data-l10n-id={this.props.contextMenuItem.get('l10nLabelId')}>{this.props.contextMenuItem.get('label')}</span>
      {
        this.hasSubmenu
        ? <span className='submenuIndicatorContainer'>
          <span className='submenuIndicatorSpacer'/>
          <span className='submenuIndicator fa fa-chevron-right'/>
        </span>
        : null
      }
    </div>
  }
}

/**
 * Represents a single popup menu (not including submenu)
 */
export default class ContextMenuSingle extends ImmutableComponent {
  render () {
    const styles = {}
    if (this.props.y) {
      styles.top = this.props.y
    }
    return <div role='list' className={cx({
      contextMenuSingle: true,
      isSubmenu: this.props.submenuIndex !== 0
    })} style={styles}>
    {
      this.props.template.map((contextMenuItem) =>
        <ContextMenuItem contextMenuItem={contextMenuItem}
          submenuIndex={this.props.submenuIndex}
          siteSettings={this.props.siteSettings}
          contextMenuDetail={this.props.contextMenuDetail}
        />)
    }
    </div>
  }
}

/**
 * Represents a context menu including all submenus
 */
export default class ContextMenu extends ImmutableComponent {
  onClick () {
    windowActions.setContextMenuDetail()
  }
  get openedSubmenuDetails () {
    return this.props.contextMenuDetail.get('openedSubmenuDetails') || new Immutable.List()
  }
  render () {
    const styles = {}
    if (this.props.contextMenuDetail.get('left') !== undefined) {
      styles.left = this.props.contextMenuDetail.get('left')
    }
    if (this.props.contextMenuDetail.get('right') !== undefined) {
      styles.right = this.props.contextMenuDetail.get('right')
    }
    if (this.props.contextMenuDetail.get('top') !== undefined) {
      styles.top = this.props.contextMenuDetail.get('top')
    }
    if (this.props.contextMenuDetail.get('bottom') !== undefined) {
      styles.bottom = this.props.contextMenuDetail.get('bottom')
    }
    if (this.props.contextMenuDetail.get('width') !== undefined) {
      styles.width = this.props.contextMenuDetail.get('width')
    }
    if (this.props.contextMenuDetail.get('maxHeight')) {
      styles.maxHeight = this.props.contextMenuDetail.get('maxHeight')
    }
    return <div
      className={cx({
        contextMenu: true,
        reverseExpand: this.props.contextMenuDetail.get('right') !== undefined,
        contextMenuScrollable: this.props.contextMenuDetail.get('maxHeight') !== undefined
      })}
      onClick={this.onClick.bind(this)}
      style={styles}>
      <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
        submenuIndex={0}
        siteSettings={this.props.siteSettings}
        template={this.props.contextMenuDetail.get('template')}/>
      {
        this.openedSubmenuDetails.map((openedSubmenuDetail, i) =>
          <ContextMenuSingle contextMenuDetail={this.props.contextMenuDetail}
            submenuIndex={i + 1}
            siteSettings={this.props.siteSettings}
            template={openedSubmenuDetail.get('template')}
            y={openedSubmenuDetail.get('y')}/>)
      }
    </div>
  }
}

module.exports = ContextMenu
