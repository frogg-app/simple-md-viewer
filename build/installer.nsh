!macro customInstall
  ; Register file associations
  WriteRegStr HKCU "Software\Classes\.md" "" "MDViewer.Document"
  WriteRegStr HKCU "Software\Classes\.markdown" "" "MDViewer.Document"
  WriteRegStr HKCU "Software\Classes\MDViewer.Document" "" "Markdown Document"
  WriteRegStr HKCU "Software\Classes\MDViewer.Document\DefaultIcon" "" "$INSTDIR\resources\md-icon.ico"
  WriteRegStr HKCU "Software\Classes\MDViewer.Document\shell\open\command" "" '"$INSTDIR\MD Viewer.exe" "%1"'

  ; Refresh shell
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUninstall
  ; Remove file associations
  DeleteRegKey HKCU "Software\Classes\.md"
  DeleteRegKey HKCU "Software\Classes\.markdown"
  DeleteRegKey HKCU "Software\Classes\MDViewer.Document"

  ; Refresh shell
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
