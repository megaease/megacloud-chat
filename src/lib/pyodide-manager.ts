// lib/pyodide-manager.ts
// Pyodide 全局管理器，优化加载性能和缓存

interface PyodideGlobals {
	get: (name: string) => unknown;
	set: (name: string, value: unknown) => void;
}

interface PyodideFS {
	writeFile: (path: string, data: string | Uint8Array) => void;
	readFile: (
		path: string,
		options?: { encoding: string },
	) => string | Uint8Array;
}

interface PyodideInstance {
	runPython: (code: string) => unknown;
	loadPackage: (packages: string[]) => Promise<void>;
	globals: PyodideGlobals;
	FS: PyodideFS;
}

interface PyodideManager {
	instance: PyodideInstance | null;
	isLoading: boolean;
	isReady: boolean;
	loadPromise: Promise<PyodideInstance> | null;
	installedPackages: Set<string>;
}

// 扩展 Window 接口
interface PyodideWindow extends Window {
	loadPyodide: (config: { indexURL: string }) => Promise<PyodideInstance>;
	pyodide: PyodideInstance;
	__pyodideManager: PyodideManager;
}

// 全局 Pyodide 管理器
function getGlobalManager(): PyodideManager {
	if (typeof window === "undefined") {
		throw new Error("Pyodide can only run in browser environment");
	}

	const pyodideWindow = window as unknown as PyodideWindow;

	if (!pyodideWindow.__pyodideManager) {
		pyodideWindow.__pyodideManager = {
			instance: null,
			isLoading: false,
			isReady: false,
			loadPromise: null,
			installedPackages: new Set(),
		};
	}

	return pyodideWindow.__pyodideManager;
}

/**
 * 初始化 Pyodide 实例
 * 使用单例模式确保全局只有一个实例
 */
export async function initializePyodide(): Promise<PyodideInstance> {
	const manager = getGlobalManager();

	// 如果已经有实例，直接返回
	if (manager.instance && manager.isReady) {
		return manager.instance;
	}

	// 如果正在加载，等待加载完成
	if (manager.loadPromise) {
		return manager.loadPromise;
	}

	// 开始加载
	manager.isLoading = true;
	manager.loadPromise = loadPyodideInstance();

	try {
		const instance = await manager.loadPromise;
		manager.instance = instance;
		manager.isReady = true;
		manager.isLoading = false;
		return instance;
	} catch (error) {
		manager.isLoading = false;
		manager.loadPromise = null;
		throw error;
	}
}

async function loadPyodideInstance(): Promise<PyodideInstance> {
	const pyodideWindow = window as unknown as PyodideWindow;

	// 检查脚本是否已加载
	if (typeof pyodideWindow.loadPyodide !== "function") {
		// 动态加载脚本
		await loadPyodideScript();
	}

	// 初始化 Pyodide
	const pyodide = await pyodideWindow.loadPyodide({
		indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
	});

	// 设置输出捕获
	pyodide.runPython(`
import sys
from io import StringIO
import traceback

class OutputCapture:
    def __init__(self):
        self.output = StringIO()
        self.error = StringIO()
        
    def write(self, text):
        self.output.write(text)
        
    def write_error(self, text):
        self.error.write(text)
        
    def flush(self):
        pass
        
    def get_output(self):
        return self.output.getvalue()
        
    def get_error(self):
        return self.error.getvalue()
        
    def clear(self):
        self.output = StringIO()
        self.error = StringIO()

_output_capture = OutputCapture()
sys.stdout = _output_capture
sys.stderr = _output_capture

# 安全的执行函数
def safe_exec(code_str):
    try:
        _output_capture.clear()
        # 使用 compile 和 exec 获得更好的错误信息
        code_obj = compile(code_str, '<user_code>', 'exec')
        exec(code_obj, globals())
        return {
            'success': True,
            'output': _output_capture.get_output(),
            'error': _output_capture.get_error(),
            'result': None
        }
    except Exception as e:
        return {
            'success': False,
            'output': _output_capture.get_output(),
            'error': _output_capture.get_error() + str(e),
            'traceback': traceback.format_exc(),
            'result': None
        }

# 安全的表达式求值函数
def safe_eval(expr_str):
    try:
        _output_capture.clear()
        result = eval(expr_str, globals())
        return {
            'success': True,
            'output': _output_capture.get_output(),
            'error': _output_capture.get_error(),
            'result': result
        }
    except Exception as e:
        return {
            'success': False,
            'output': _output_capture.get_output(),
            'error': _output_capture.get_error() + str(e),
            'traceback': traceback.format_exc(),
            'result': None
        }
	`);

	return pyodide;
}

async function loadPyodideScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Pyodide script"));
		document.head.appendChild(script);
	});
}

/**
 * 执行 Python 代码
 */
export async function executePythonCode(code: string): Promise<{
	success: boolean;
	output: string;
	error: string;
	result: unknown;
	traceback?: string;
}> {
	const pyodide = await initializePyodide();

	try {
		// 使用安全执行函数
		const result = pyodide.runPython(`safe_exec(${JSON.stringify(code)})`);
		return result as {
			success: boolean;
			output: string;
			error: string;
			result: unknown;
			traceback?: string;
		};
	} catch (error) {
		return {
			success: false,
			output: "",
			error: error instanceof Error ? error.message : String(error),
			result: null,
		};
	}
}

/**
 * 求值 Python 表达式
 */
export async function evaluatePythonExpression(expression: string): Promise<{
	success: boolean;
	output: string;
	error: string;
	result: unknown;
	traceback?: string;
}> {
	const pyodide = await initializePyodide();

	try {
		const result = pyodide.runPython(
			`safe_eval(${JSON.stringify(expression)})`,
		);
		return result as {
			success: boolean;
			output: string;
			error: string;
			result: unknown;
			traceback?: string;
		};
	} catch (error) {
		return {
			success: false,
			output: "",
			error: error instanceof Error ? error.message : String(error),
			result: null,
		};
	}
}

/**
 * 安装 Python 包
 */
export async function installPythonPackage(packageName: string): Promise<{
	success: boolean;
	message: string;
}> {
	const manager = getGlobalManager();

	// 检查是否已安装
	if (manager.installedPackages.has(packageName)) {
		return {
			success: true,
			message: `包 ${packageName} 已经安装`,
		};
	}

	try {
		const pyodide = await initializePyodide();
		await pyodide.loadPackage([packageName]);
		manager.installedPackages.add(packageName);
		return {
			success: true,
			message: `成功安装包 ${packageName}`,
		};
	} catch (error) {
		return {
			success: false,
			message: `安装包 ${packageName} 失败：${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * 获取 Pyodide 状态
 */
export function getPyodideStatus(): {
	isReady: boolean;
	isLoading: boolean;
	installedPackages: string[];
} {
	const manager = getGlobalManager();
	return {
		isReady: manager.isReady,
		isLoading: manager.isLoading,
		installedPackages: Array.from(manager.installedPackages),
	};
}

/**
 * 预加载常用包
 */
export async function preloadCommonPackages(): Promise<void> {
	const commonPackages = ["numpy", "pandas", "matplotlib"];

	try {
		const pyodide = await initializePyodide();
		// 并行安装常用包
		await Promise.allSettled(
			commonPackages.map((pkg) => installPythonPackage(pkg)),
		);
	} catch (error) {
		console.warn("Failed to preload some packages:", error);
	}
}
