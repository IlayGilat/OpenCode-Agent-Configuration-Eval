import sys
if 'accumulated_context' not in sys.modules['__main__'].__dict__:
    sys.modules['__main__'].__dict__['accumulated_context'] = []
sys.modules['__main__'].__dict__['accumulated_context'].append('some_long_data_' * 1000)
print(f'Context size: {len(sys.modules['__main__'].__dict__['accumulated_context'])}')
