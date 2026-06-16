import json
f = open('/Users/yaoleyxing/Developer/solo-mange-pro/MP0239/assets/scenes/Result.scene','r')
data = json.load(f)
f.close()
print('Total:', len(data))
for i,item in enumerate(data):
    t = item.get('__type__','?')
    n = item.get('_name','')
    print('[{}] {} {}'.format(i, t, n))
s = data[4]
bindings = ['scoreLabel','gradeLabel','timeLabel','accuracyLabel','accuracyProgress','correctCountLabel','resultTitleLabel','levelNameLabel','wrongItemsScrollView','wrongItemsSection','retryButton','backButton','nextLevelButton','passedBadge','failedBadge','wrongItemCardPrefab']
print('--- Script bindings ---')
for k in bindings:
    v = s.get(k)
    if v is None:
        print('{}: null'.format(k))
    else:
        rid = v['__id__']
        rt = data[rid].get('__type__','?')
        print('{} -> [{}] {}'.format(k, rid, rt))
print('--- Parent-child check ---')
errors = 0
for i,item in enumerate(data):
    if item.get('__type__')=='cc.Node':
        pr = item.get('_parent')
        if pr:
            pid = pr['__id__']
            cids = [c['__id__'] for c in data[pid].get('_children',[])]
            if i not in cids:
                print('ERR: [{}] not in parent {} children'.format(i, pid))
                errors += 1
        for cr in item.get('_children',[]):
            cid = cr['__id__']
            cp = data[cid].get('_parent')
            if cp and cp['__id__']!=i:
                print('ERR: [{}] parent mismatch'.format(cid))
                errors += 1
if errors==0:
    print('All parent-child references OK!')
else:
    print('{} errors found'.format(errors))
