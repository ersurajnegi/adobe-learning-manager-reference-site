/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, act } from '@testing-library/react';

// ─── Module mocks (hoisted, no implementations — set in beforeEach) ───────────

jest.mock('three', () => ({
  SphereGeometry: jest.fn(),
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  WebGLRenderer: jest.fn(),
  Vector3: jest.fn(),
  LineBasicMaterial: jest.fn(),
  BufferGeometry: jest.fn(),
  Line: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  Mesh: jest.fn(),
  Raycaster: jest.fn(),
  Vector2: jest.fn(),
}));

jest.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: jest.fn(),
}));

jest.mock('@tweenjs/tween.js', () => ({
  default: {
    Tween: jest.fn(),
    update: jest.fn(),
    Easing: { Quartic: { InOut: {} } },
  },
}));

jest.mock('three-spritetext', () => jest.fn());

jest.mock('@utils/restAdapter', () => ({
  RestAdapter: { ajax: jest.fn() },
}));

jest.mock('@utils/translationService', () => ({
  GetTranslation: jest.fn((key: string) => key),
}));

jest.mock('@utils/global', () => ({
  getALMConfig: jest.fn(),
  getALMAccount: jest.fn(),
}));

jest.mock('@utils/inline_svg', () => ({
  RESET_ICON_SVG: jest.fn(() => ''),
}));

jest.mock('@utils/constants', () => ({
  EXTERNAL_SKILL_IFRAME_ID: 'external-skill-iframe',
}));

jest.mock('@spectrum-icons/workflow/Close', () => () => null);

jest.mock('react-dom/server', () => ({
  renderToStaticMarkup: jest.fn(() => ''),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  SphereGeometry,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Vector3,
  LineBasicMaterial,
  BufferGeometry,
  Line,
  MeshBasicMaterial,
  Mesh,
  Raycaster,
  Vector2,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RestAdapter } from '@utils/restAdapter';
import { getALMConfig, getALMAccount } from '@utils/global';
import { GetTranslation } from '@utils/translationService';
import ExternalSkillGraphComponent from '@components/ALMSkills/ExternalSkillGraph/ExternalSkillGraphComponent';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMockIframeDocument() {
  const mockNode = () => ({
    id: '',
    className: '',
    innerHTML: '',
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    remove: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    parentElement: null,
    tagName: 'SPAN',
    contains: jest.fn(() => false),
  });
  return {
    documentElement: { clientWidth: 1024 },
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    createElement: jest.fn(() => mockNode()),
    getElementById: jest.fn(() => null),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    activeElement: null,
    createTextNode: jest.fn((t: string) => t),
  };
}

function setupThreeMocks(mockCanvas: HTMLCanvasElement, mockDisconnect: jest.Mock) {
  (Scene as unknown as jest.Mock).mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    position: { x: 0, y: 0, z: 0 },
  }));
  (PerspectiveCamera as unknown as jest.Mock).mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0 },
    lookAt: jest.fn(),
  }));
  (WebGLRenderer as unknown as jest.Mock).mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: mockCanvas,
  }));
  (SphereGeometry as unknown as jest.Mock).mockImplementation(() => ({}));
  (Vector3 as unknown as jest.Mock).mockImplementation(function (x: number, y: number, z: number) {
    this.x = x; this.y = y; this.z = z; this.copy = jest.fn();
  });
  (LineBasicMaterial as unknown as jest.Mock).mockImplementation(() => ({}));
  (BufferGeometry as unknown as jest.Mock).mockImplementation(() => ({ setFromPoints: jest.fn() }));
  (Line as unknown as jest.Mock).mockImplementation(() => ({}));
  (MeshBasicMaterial as unknown as jest.Mock).mockImplementation(() => ({}));
  (Mesh as unknown as jest.Mock).mockImplementation(() => ({
    position: { x: 0, y: 0, z: 0 },
    name: '',
    material: { color: { setHex: jest.fn() } },
  }));
  (Raycaster as unknown as jest.Mock).mockImplementation(() => ({
    setFromCamera: jest.fn(),
    intersectObjects: jest.fn(() => []),
  }));
  (Vector2 as unknown as jest.Mock).mockImplementation(() => ({ x: 0, y: 0 }));
  (OrbitControls as unknown as jest.Mock).mockImplementation(() => ({
    enableDamping: false,
    dampingFactor: 0,
    rotateSpeed: 0,
    zoomSpeed: 0,
    update: jest.fn(),
    enabled: true,
  }));
  const TWEEN = require('@tweenjs/tween.js').default;
  (TWEEN.Tween as jest.Mock).mockImplementation(() => ({
    update: jest.fn(),
    to: jest.fn().mockReturnThis(),
    easing: jest.fn().mockReturnThis(),
    onUpdate: jest.fn().mockReturnThis(),
    onComplete: jest.fn().mockReturnThis(),
    start: jest.fn().mockReturnThis(),
  }));
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: mockDisconnect,
    unobserve: jest.fn(),
  })) as any;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExternalSkillGraphComponent', () => {
  let mockIframeDocument: ReturnType<typeof buildMockIframeDocument>;
  let mockDisconnect: jest.Mock;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    jest.useFakeTimers();
    mockIframeDocument = buildMockIframeDocument();
    mockDisconnect = jest.fn();
    mockCanvas = document.createElement('canvas');

    // Intercept iframe lookup; delegate all other selectors to the real implementation
    jest.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '#external-skill-iframe') {
        return { contentWindow: { document: mockIframeDocument } } as any;
      }
      return HTMLDocument.prototype.querySelector.call(document, selector);
    });

    setupThreeMocks(mockCanvas, mockDisconnect);

    (RestAdapter.ajax as jest.Mock).mockResolvedValue(
      JSON.stringify({ nodes_data: [], is_paginated: 0 })
    );
    (getALMConfig as jest.Mock).mockReturnValue({
      primeApiURL: 'https://api.test',
      learnerMobileApp: false,
    });
    (getALMAccount as jest.Mock).mockResolvedValue({ id: 'account-1' });
    (GetTranslation as jest.Mock).mockImplementation((key: string) => key);

    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    }) as any;
    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ─── Render structure ──────────────────────────────────────────────────────

  describe('render structure', () => {
    it('renders_searchInput_withSearchType', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      const input = document.querySelector('[automation-id="skillInput"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('search');
    });

    it('renders_graphArea_element', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      expect(document.querySelector('[automation-id="graph-area"]')).toBeInTheDocument();
    });

    it('renders_accountSpecificCheckbox', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      const checkbox = document.querySelector('[automation-id="accountSpecificCheckbox"]') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();
      expect(checkbox.type).toBe('checkbox');
    });

    it('renders_selectedSkillsHeading', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      expect(document.querySelector('[automation-id="selectedSkillsHeading"]')).toBeInTheDocument();
    });

    it('renders_searchRole_withSearchBoxLabel', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      // GetTranslation is mocked to return the key; the search span uses the key as aria-label
      const searchBox = document.querySelector('[role="search"]');
      expect(searchBox).toBeInTheDocument();
      expect(searchBox?.getAttribute('aria-label')).toBe('alm.skillSearchPlaceholder');
    });
  });

  // ─── learnerMobileApp visibility ──────────────────────────────────────────

  describe('learnerMobileApp visibility', () => {
    it('hidesGraphAndHeading_whenLearnerMobileApp_isTrue', async () => {
      (getALMConfig as jest.Mock).mockReturnValue({
        primeApiURL: 'https://api.test',
        learnerMobileApp: true,
      });
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      // identity-obj-proxy returns the class name string; displayNone class applied to both
      const graphArea = document.querySelector('[automation-id="graph-area"]');
      expect(graphArea?.className).toContain('displayNone');
    });

    it('showsGraphAndHeading_whenLearnerMobileApp_isFalse', async () => {
      (getALMConfig as jest.Mock).mockReturnValue({
        primeApiURL: 'https://api.test',
        learnerMobileApp: false,
      });
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      const graphArea = document.querySelector('[automation-id="graph-area"]');
      expect(graphArea?.className).not.toContain('displayNone');
    });
  });

  // ─── useImperativeHandle / stopThreeJS ────────────────────────────────────

  describe('stopThreeJS imperative handle', () => {
    it('stopThreeJS_callsCancelAnimationFrame', async () => {
      const ref = React.createRef<any>();
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
            ref={ref}
          />
        );
      });
      act(() => {
        ref.current?.stopThreeJS();
      });
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('stopThreeJS_disconnectsResizeObserver', async () => {
      const ref = React.createRef<any>();
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
            ref={ref}
          />
        );
      });
      act(() => {
        ref.current?.stopThreeJS();
      });
      expect(mockDisconnect).toHaveBeenCalled();
    });

  });

  // ─── API call on mount ────────────────────────────────────────────────────

  describe('fetchGraphData on mount', () => {
    it('callsRestAdapter_withInitGraphUrl_onMount', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      expect(RestAdapter.ajax).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/cc/init_external_skill_graph'),
          method: 'GET',
        })
      );
    });

    it('doesNotSendAccountId_onFirstMount_allAccountsDefault', async () => {
      // ALL_ACCOUNTS defaults to true on first load, so no account_id filter is applied.
      // Switching to account-specific mode happens via the checkbox (not tested here).
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      expect(RestAdapter.ajax).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.not.objectContaining({ account_id: expect.anything() }),
        })
      );
    });
  });

  // ─── Pre-selected skills ──────────────────────────────────────────────────

  describe('selectedExternalInterest pre-population', () => {
    it('fetchesNodeMeta_forPreSelectedSkill_notInGraph', async () => {
      // raw node format: [id, name, cluster, fx, fy, fz, is_main, color, links]
      const mockNodeData = [101, 'JavaScript', 1, 10.5, 20.3, 5.1, 1, '#db6257', [200, 201]];
      (RestAdapter.ajax as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify({ nodes_data: [], is_paginated: 0 })) // init graph
        .mockResolvedValueOnce(JSON.stringify({ nodes_data: mockNodeData })); // meta for node 101

      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[101]}
          />
        );
      });

      const metaCalls = (RestAdapter.ajax as jest.Mock).mock.calls.filter(([arg]: any[]) =>
        arg.url.includes('/cc/get_node_meta')
      );
      expect(metaCalls).toHaveLength(1);
      expect(metaCalls[0][0].url).toContain('node_id=101');
    });

    it('doesNotFetchNodeMeta_whenSelectedExternalInterest_isEmpty', async () => {
      await act(async () => {
        render(
          <ExternalSkillGraphComponent
            setSelectedExternalInterest={jest.fn()}
            selectedExternalInterest={[]}
          />
        );
      });
      const metaCalls = (RestAdapter.ajax as jest.Mock).mock.calls.filter(([arg]: any[]) =>
        arg.url?.includes('/cc/get_node_meta')
      );
      expect(metaCalls).toHaveLength(0);
    });
  });
});
