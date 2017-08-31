(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  const CHARITIES = [
    {
      label: 'Greater Houston Community Foundation',
      url: 'http://cfl.re/greaterhouston'
    },
    {
      label: 'United Way Houston',
      url: 'https://www.unitedwayhouston.org/flood/flood-donation/'
    },
    {
      label: 'Center for Disaster Philanthropy',
      url: 'https://disasterphilanthropy.networkforgood.com/'
    },
    {
      label: 'Salvation Army USA',
      url: 'https://give.salvationarmyusa.org/site/Donation2?df_id=27651&mfc_pref=T&27651.donation=form1'
    }
  ]

  CHARITIES.sort(() => Math.random() * 2 - 1)

  const VISIBILITY_ATTRIBUTE = 'data-cf-hurricane-relief-visibility'
  const documentElementOriginallyPositionStatic = window.getComputedStyle(document.documentElement).position === 'static'

  const element = document.createElement('cloudflare-app')
  element.setAttribute('app', 'hurricane-relief')

  const htmlStyle = document.createElement('style')
  document.head.appendChild(htmlStyle)

  const elementStyle = document.createElement('style')
  document.head.appendChild(elementStyle)

  function getMaxZIndex () {
    var max = 0
    var elements = document.getElementsByTagName('*')

    Array.prototype.slice.call(elements).forEach(element => {
      var zIndex = parseInt(document.defaultView.getComputedStyle(element).zIndex, 10)

      max = zIndex ? Math.max(max, zIndex) : max
    })

    return max
  }

  function setPageStyles () {
    setHTMLStyle()
    setFixedElementStyles()
  }

  function setHTMLStyle () {
    if (!document.body) return

    let style = ''

    if (documentElementOriginallyPositionStatic && isShown()) {
      style = `
        html {
          position: relative;
          top: ${element.clientHeight}px;
        }
      `
    }

    htmlStyle.innerHTML = style
  }

  function setFixedElementStyles () {
    function removeTopStyle (node) {
      const currentStyle = node.getAttribute('style')
      if (!currentStyle) return

      node.setAttribute('style', currentStyle.replace(/top[^]+?/g, ''))
    }

    // Cache this to minimize potential repaints.
    const elementHeight = element.clientHeight

    // Find fixed position nodes to adjust.
    const allNodes = document.querySelectorAll('*:not([app="hurricane-relief"]):not([data-cfapps-hurricane-relief-adjusted-fixed-element-original-top])')

    Array.prototype.forEach.call(allNodes, node => {
      const computedStyle = window.getComputedStyle(node)
      const boundingClientRect = node.getBoundingClientRect()

      const isSticky = computedStyle.position === 'sticky'
      const isFixed = computedStyle.position === 'fixed'
      const isBottomFixed = computedStyle.bottom === '0px' && boundingClientRect.bottom === window.innerHeight && boundingClientRect.top >= elementHeight

      if (INSTALL_ID === 'preview' && node.nodeName === 'IFRAME' && node.src.indexOf('https://embedded.cloudflareapps.com') !== -1) {
        // HACK: Improves mobile experience by omitting preview notice.
        return
      }

      if ((isFixed || isSticky) && !isBottomFixed) {
        const {top} = boundingClientRect
        const styleTop = parseInt(computedStyle.top, 10)

        if (isSticky || (top === styleTop && top <= elementHeight)) {
          node.setAttribute('data-cfapps-hurricane-relief-adjusted-fixed-element-original-top', top)
        }
      }
    })

    // Adjust them.
    const adjustedNodes = document.querySelectorAll('[data-cfapps-hurricane-relief-adjusted-fixed-element-original-top]')

    Array.prototype.forEach.call(adjustedNodes, node => {
      removeTopStyle(node)

      const computedStyle = window.getComputedStyle(node)
      const isFixedOrSticky = computedStyle.position === 'fixed' || computedStyle.position === 'sticky'

      if (isFixedOrSticky && isShown() && elementHeight > 0) {
        const newTop = (parseInt(computedStyle.top, 10) || 0) + elementHeight
        node.style.top = newTop + 'px'
      }
    })
  }

  function isShown () {
    return document.documentElement.getAttribute(VISIBILITY_ATTRIBUTE) === 'visible'
  }

  function hideWelcomeBar () {
    document.documentElement.setAttribute(VISIBILITY_ATTRIBUTE, 'hidden')

    try {
      window.localStorage.cfSeenHurricaneDonateBar = 'true'
    } catch (e) {}

    setPageStyles()
  }

  function updateElementStyle () {
    elementStyle.innerHTML = `
      cloudflare-app[app="hurricane-relief"] {
        background-color: #fff;
        color: #000;
      }

      .select-theme-hurricane-relief.select-element {
        z-index: ${element.style.zIndex}
      }
    `

    element.setAttribute('data-style', 'prominent')
  }

  function updateElement () {
    let hasSeenAlert = false

    try {
      hasSeenAlert = window.localStorage.cfSeenHurricaneDonateBar
    } catch (e) {}

    if (hasSeenAlert && INSTALL_ID !== 'preview') return

    element.innerHTML = ''
    element.style.zIndex = getMaxZIndex() + 1
    updateElementStyle()

    const messageContainer = document.createElement('alert-message')

    // NOTE: this fixes an oddity in the App Bundler that omits blank strings.
    const messageContent = document.createElement('alert-message-content')
    messageContent.textContent = 'Want to help Hurricane Harvey victims?'

    messageContainer.appendChild(messageContent)

    const charitiesSelect = document.createElement('select')

    const defaultOption = document.createElement('option')
    defaultOption.textContent = 'Donate now'
    defaultOption.disabled = true
    defaultOption.selected = true
    defaultOption.hidden = true
    charitiesSelect.appendChild(defaultOption)

    CHARITIES.forEach(charity => {
      const option = document.createElement('option')
      option.textContent = charity.label
      option.value = charity.url
      charitiesSelect.appendChild(option)
    })

    charitiesSelect.addEventListener('change', (event) => {
      const [selected] = event.target.selectedOptions
      window.open(selected.value, '_blank')
      hideWelcomeBar()
    })

    messageContent.appendChild(charitiesSelect)

    element.appendChild(messageContainer)

    const dismissButton = document.createElement('alert-dismiss')

    dismissButton.setAttribute('role', 'button')
    dismissButton.textContent = '×'

    dismissButton.addEventListener('click', hideWelcomeBar)

    element.appendChild(dismissButton)

    document.documentElement.setAttribute(VISIBILITY_ATTRIBUTE, 'visible')

    window.Select.init({
      select: 'cloudflare-app["hurricane-relief"] > select',
      className: 'select-theme-hurricane-relief'
    })
  }

  function bootstrap () {
    document.body.appendChild(element)

    updateElement()

    window.requestAnimationFrame(setPageStyles)
    window.addEventListener('resize', setPageStyles)
  }

  // This code ensures that the app doesn't run before the page is loaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap)
  } else {
    bootstrap()
  }
}())
