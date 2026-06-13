import 'package:flutter_test/flutter_test.dart';
import 'package:lyket/app.dart';

void main() {
  testWidgets('App renders', (WidgetTester tester) async {
    await tester.pumpWidget(const LyketApp());
    expect(find.byType(LyketApp), findsOneWidget);
  });
}
